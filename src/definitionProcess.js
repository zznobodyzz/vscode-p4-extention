
// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const util = require('./util');
const defexpr = require('./definitionExpr');

function CdefinitionPositionInfo() {
    this.file = null;
    this.line = null;
    this.charactor = null;

    this.setPosition = function(file, line, charactor) {
        this.file = file;
        this.line = line;
        this.charactor = charactor;
    }

    this.getFile = function() {
        return this.file;
    }

    this.getLine = function() {
        return this.line;
    }

    this.getCharactor = function() {
        return this.charactor;
    }

    this.getAll = function() {
        return [this.file, this.line, this.charactor];
    }

    this.isEqual = function(other) {
        return (this.file === other.file && this.line === other.line);
    }
}

/*store variableName => typeName, lines*/
function CtypeStore() {
    this.result = {};
    this.lineNums = 0;

    this.addTypeInfo = function(variableName, typeName, file, line, character) {
        var definitionPositionInfo = new CdefinitionPositionInfo();
        definitionPositionInfo.setPosition(file, line, character);
        this.result[variableName] = [typeName, definitionPositionInfo];
    }

    this.setLineNums = function(lineNums) {
        this.lineNums = lineNums;
    }

    this.getLineNums = function() {
        return this.lineNums;
    }

    this.isKnownVariable = function(variableName) {
        return this.result.hasOwnProperty(variableName);
    }

    this.getVariableTypeName = function(variableName) {
        return this.result[variableName][0];
    }

    this.getVariablePositionInfo = function(variableName) {
        return this.result[variableName][1];
    }

    this.getAllVariable = function() {
        return Object.keys(this.result);
    }

    this.isEmpty = function() {
        return Object.keys(this.result).length === 0;
    }
}

function CdefinitionStore() {
    this.definitionPosition = {};
    this.definitionTypeInfo = {};
    this.definitionTypedefInfo = {};

    this.clearAll = function() {
        this.definitionPosition = {};
        this.definitionTypeInfo = {};
        this.definitionTypedefInfo = {};
    }

    this.addDefInfo = function(name, fileName, line, character) {
        var definitionPositionInfo = new CdefinitionPositionInfo();
        definitionPositionInfo.setPosition(fileName, line, character);
        if (this.definitionPosition[name] === undefined) {
            this.definitionPosition[name] = [];
        }
        this.definitionPosition[name].push(definitionPositionInfo);
    }

    this.addTypeInfo = function(name, typeStore) {
        this.definitionTypeInfo[name] = typeStore;
    }

    this.addTypedefInfo = function(name, typedefInfo) {
        this.definitionTypedefInfo[name] = typedefInfo;
    }

    this.getDefFilePosition = function(name) {
        return new vscode.Position(this.definitionPosition[name][0].getLine(), this.definitionPosition[name][0].getCharactor());
    }

    this.getDefFileName = function(name) {
        return this.definitionPosition[name][0].getFile();
    }

    this.getRepeatDefExactInfo = function(name, positionInfo) {
        var retval = null;
        this.definitionPosition[name].some( defPos => {
            if (defPos.isEqual(positionInfo)) {
                retval = defPos.getAll();
                return true;
            }
        });
        return retval;
    }

    this.getTypedefInfo = function(name) {
        return this.definitionTypedefInfo[name];
    }

    this.getTypeInfo = function(name) {
        return this.definitionTypeInfo[name];
    }

    this.isKnownDef = function(name) {
        return this.definitionPosition[name] !== undefined;
    }

    this.isRepeatDef = function(name) {
        if (this.isKnownDef(name)) {
            if (this.definitionPosition[name].length > 1) {
                return true;
            }
        }
        return false;
    }

    this.isKnownType = function(name) {
        return this.definitionTypeInfo.hasOwnProperty(name);
    }

    this.isKnownTypedef = function(name) {
        return this.definitionTypedefInfo.hasOwnProperty(name);
    }
}

function regexSearchResult() {
    this.result = {};

    this.isMatch = function() {
        return !(Object.keys(this.result).length === 0);
    }

    this.getFirstMatchWord = function() {
        if (this.isMatch()) {
            return Object.keys(this.result)[0];
        }
        return null;
    }

    this.getLastMatchWord = function() {
        if (this.isMatch()) {
            let keys = Object.keys(this.result);
            return keys[keys.length - 1];
        }
        return null;
    }

    this.addResult = function(word, index) {
        this.result[word] = index;
    }

    this.combineResult = function(other) {
        var tmp = other.getResult();
        for (var key in tmp) {
            this.result[key] = tmp[key];
        }
    }

    this.getAllMatchWord = function() {
        return Object.keys(this.result);
    }

    this.getWordPostion = function(word) {
        if (this.result.hasOwnProperty(word)) {
            return this.result[word];
        }
        return null;
    }

    this.getResult = function() {
        return this.result;
    }
}

var definitionStore = new CdefinitionStore();

function doRegexSearch(exp, string, search_mode) {
    var regex = new RegExp(exp, "g");
    var searchResult = new regexSearchResult();
    var result;
    if (search_mode === "all") {
        while ((result = regex.exec(string)) !== null) {
            searchResult.addResult(result[0], result.index);
        }
    } else {
        if ((result = regex.exec(string)) !== null) {
            searchResult.addResult(result[0], result.index);
        }
    }
    return searchResult;
}

function getNameInLine(lineText, search_type, expr) {
    var retval = new regexSearchResult();
    expr.forEach(exp => {
        retval.combineResult(doRegexSearch(exp, lineText, search_type));
    });
    return retval;
}

function getDefinitionsInFile(file) {
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    data_p.forEach(line => {
        ret = getNameInLine(line, "all", defexpr.d_exp);
        ret.getAllMatchWord().forEach( word => {
            definitionStore.addDefInfo(word, file, index, ret.getWordPostion(word));
        })
        index += 1;
    });
}

function getStructInfo(file, data_p, line) {
    var op = 0;
    var set = false;
    let lineNum = 0;
    var result = new CtypeStore();
    if (data_p[line + lineNum].search("{") !== -1) {
        op += 1;
        set = true;
    }
    lineNum += 1;
    while (line + lineNum < data_p.length) {
        var index = line + lineNum;
        if (data_p[index].search("{") !== -1) {
            op += 1;
            set = true;
        } else if(data_p[index].search("}") !== -1){
            op -= 1;
        }
        if (op === 0 && set) {
            lineNum += 1;
            break;
        }
        let variableName = getNameInLine(data_p[index], "one", defexpr.v_exp);
        if (!variableName.isMatch()) {
            lineNum += 1;
            continue;
        }
        let typeName = getNameInLine(data_p[index], "one", defexpr.vt_exp);
        if (!typeName.isMatch()) {
            lineNum += 1;
            continue;
        }
        if (!result.isKnownVariable(variableName.getFirstMatchWord())) {
            result.addTypeInfo(variableName.getFirstMatchWord(), typeName.getFirstMatchWord(), file, index, variableName.getWordPostion(variableName.getFirstMatchWord()));
        }
        lineNum += 1;
    }
    result.setLineNums(lineNum);
    return result;
}

function getAllParamsInDefinition(file, data_p, start_line) {
    var line = start_line;
    var typedefName = getNameInLine(data_p[line], "one", defexpr.td_exp);
    if (typedefName.isMatch()) {
        var typedefTypeName = getNameInLine(data_p[line], "one", defexpr.tdt_exp);
        if (typedefTypeName.isMatch()) { 
            definitionStore.addTypedefInfo(typedefName.getFirstMatchWord(), typedefTypeName.getFirstMatchWord());
        }
        return 1;
    }
    var typeName = getNameInLine(data_p[line], "one", defexpr.t_exp);
    if (typeName.isMatch()) {
        var ret = getStructInfo(file, data_p, line);
        if (!ret.isEmpty()) {
            definitionStore.addTypeInfo(typeName.getFirstMatchWord(), ret);
        }
        return ret.getLineNums();
    }
    return 1;
}

function getDefinitionRelationShip(file) {
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    while (index < data_p.length) {
        let line = data_p[index];
        var match = false;
        let skipLine = getAllParamsInDefinition(file, data_p, index);
        index += skipLine;
    }
}

function definitionSync(uri) {
    definitionStore.clearAll();
    vscode.window.setStatusBarMessage('Synchronizing...');
    var workDir = null;
    if (!uri) {
        workDir = util.getProjectPath();
        if (!workDir) {
            vscode.window.showInformationMessage('Synchronizing Failed, Try Command In Right Click');
            return;
        }
    } else {
        workDir = path.dirname(uri.path.substr(1));
    }
    var files = fs.readdirSync(workDir);
    var ret = null;
    var retTmp = null;
    files.forEach(file => {
        var s1 = file.substr(0,1);
        var s2 = file.substr(-3,3);
        if (s1 !== "." && s2 === ".p4") {
            getDefinitionsInFile(path.join(workDir, file));
            getDefinitionRelationShip(path.join(workDir, file));
        }
    });
    console.log(definitionStore.definitionTypeInfo);
    vscode.window.setStatusBarMessage('Synchronize Done');
}

function getRelationWords(document, word, position) {
    let line = document.lineAt(position).text;
    line = line.substr(0, position.character);
    let exp = "\\b([a-zA-Z0-9_]+\\.)+";
    let ret = doRegexSearch(exp, line, "all");
    if (!ret.isMatch()) {
        return null;
    }
    let words = ret.getLastMatchWord();
    words = words.substr(0, words.length - 1);
    return words.split(".");
}

function findDefinitionsInSync(document, word, position) {
    if (!definitionStore.isKnownDef(word)) {
        return null;
    }
    if (!definitionStore.isRepeatDef(word)) {
        return [definitionStore.getDefFileName(word), definitionStore.getDefFilePosition(word)];
    }
    var words = null;
    let retval = [definitionStore.getDefFileName(word), definitionStore.getDefFilePosition(word)];
    if ((words = getRelationWords(document, word, position)) === null) {
        return retval;
    }
    let typeInfo = getDefinitionCompletionItem(document, position, words);
    if (typeInfo === null) {
        return retval;
    }
    if (!typeInfo.isKnownVariable(word)) {
        return retval;
    }
    let PositionInfo = typeInfo.getVariablePositionInfo(word);
    let DefinePositionInfo = definitionStore.getRepeatDefExactInfo(word, PositionInfo);
    if (DefinePositionInfo === null) {
        return retval;
    }
    return [DefinePositionInfo[0], new vscode.Position(DefinePositionInfo[1], DefinePositionInfo[2])];
}

function findDefinitionsInCurFile(document, position, word) {
    var line = position.line - 1;
    while (line >= 0) {
        var line_text = document.lineAt(line);
        var column = getNameInLine(line_text.text, "all", defexpr.d_exp).getWordPostion(word);
        if ( column !== null ) {
            return [document.fileName, new vscode.Position(line, column)];
        }
        line -= 1;
    }
    return null;
}

function findDefinitionsInFile(file, word) {
    var column = null;
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    data_p.some(line => {
        column = getNameInLine(line, "all", defexpr.d_exp).getWordPostion(word);
        if (column !== null) {
            ret = new vscode.Position(index, column);
            return true;
        }
        index += 1;
    });
    return ret;
}

function findDefinitionsInAllFile(workDir, fileName, word) {
    var files = fs.readdirSync(workDir);
    var ret = null;
    var retPos = null;
    files.some(file => {
        var s = file.substr(0,1);
        if (s === ".") {
            return false;
        }
        s = file.substr(-3,3);
        if (s !== ".p4") {
            return false;
        }
        if (file === path.basename(fileName)) {
            return false;
        }
        retPos = findDefinitionsInFile(path.join(workDir, file), word);
        if (retPos !== null) {
            ret = [path.join(workDir, file), retPos];
            return true;
        }
    });
    return ret;
}

function getDefinitionCompletionItem(document, position, words) {
    var typeInfo = null;
    let ret = findDefinitionsInCurFile(document, position, words[0]);
    if (ret === null) {
        return null;
    }
    let typeName = getNameInLine(document.lineAt(ret[1].line).text, "all", defexpr.vt_exp).getFirstMatchWord();
    if (typeName === null) {
        return null;
    }
    if (definitionStore.isKnownTypedef(typeName)) {
        typeName = definitionStore.getTypedefInfo(typeName);
    }
    if (!definitionStore.isKnownType(typeName)) {
        return null;
    }
    typeInfo = definitionStore.getTypeInfo(typeName);
    words.shift();
    words.some( word => {
        if (!typeInfo.isKnownVariable(word)) {
            typeInfo = null;
            return true;
        }
        typeName = typeInfo.getVariableTypeName(word);
        if (definitionStore.isKnownTypedef(typeName)) {
            typeName = definitionStore.getTypedefInfo(typeName);
        }
        if (!definitionStore.isKnownType(typeName)) {
            typeInfo = null;
            return true;
        }
        typeInfo = definitionStore.getTypeInfo(typeName);
    })
    return typeInfo;
}

exports.findDefinitionsInSync = findDefinitionsInSync;
exports.findDefinitionsInAllFile = findDefinitionsInAllFile;
exports.findDefinitionsInCurFile = findDefinitionsInCurFile;

exports.definitionSync = definitionSync;
exports.getDefinitionCompletionItem = getDefinitionCompletionItem;