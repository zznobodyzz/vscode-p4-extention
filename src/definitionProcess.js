
// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
// @ts-ignore
const readline = require('readline');
const util = require('./util');
const defexpr = require('./definitionExpr');

/*store variableName => typeName, lines*/
function CtypeStore() {
    this.result = {};
    this.lineNums = 0;

    this.addTypeInfo = function(variableName, typeName) {
        this.result[variableName] = typeName;
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

    this.getTypeName = function(variableName) {
        return this.result[variableName];
    }

    this.getAllVariable = function() {
        return Object.keys(this.result);
    }
}

function CdefinitionStore() {
    this.definitionPosition = {};
    this.definitionTypeInfo = {};
    this.definitionTypedefInfo = {};

    this.addDefInfo = function(name, fileName, line, character) {
        this.definitionPosition[name] = [fileName, line, character];
    }

    this.addDefTypeInfo = function(name, typeStore) {
        this.definitionTypeInfo[name] = typeStore;
    }

    this.addDefTypedefInfo = function(name, typedefInfo) {
        this.definitionTypedefInfo[name] = typedefInfo;
    }

    this.getDefFilePosition = function(name) {
        return new vscode.Position(this.definitionPosition[name][1], this.definitionPosition[name][2]);
    }

    this.getDefFileName = function(name) {
        return this.definitionPosition[name][0];
    }

    this.getDefTypedef = function(name) {
        return this.definitionTypedefInfo[name];
    }

    this.getDefType = function(name) {
        return this.definitionTypeInfo[name];
    }

    this.isKnownDef = function(name) {
        return this.definitionPosition.hasOwnProperty(name);
    }

    this.isKnownDefType = function(name) {
        return this.definitionTypeInfo.hasOwnProperty(name);
    }

    this.isKnownDefTypedef = function(name) {
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

function getNameInLine(lineText, nameType, search_type) {
    var expr = [];
    if (nameType === "variable") {
        expr = defexpr.variable_match_expr;
    } else if (nameType === "type") {
        expr = defexpr.type_match_expr;
    } else if (nameType === "vtype") {
        expr = defexpr.vtype_match_expr;
    } else if (nameType === "typedef") {
        expr = defexpr.typedef_match_expr;
    } else if (nameType === "define") {
        expr = defexpr.definition_match_expr;
    } else if (nameType === 'define_type') {
        expr = defexpr.define_type_match_expr;
    }
    var retval = new regexSearchResult();
    expr.forEach(exp => {
        retval.combineResult(doRegexSearch(exp, lineText, search_type));
    });
    return retval;
}

function findDefinitionsInSync(word) {
    if (definitionStore.isKnownDef(word)) {
        return [definitionStore.getDefFileName(word), definitionStore.getDefFilePosition(word)];
    }
    return null;
}

function getDefinitionsInFile(file) {
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    data_p.forEach(line => {
        ret = getNameInLine(line, "define", "all");
        ret.getAllMatchWord().forEach( word => {
            definitionStore.addDefInfo(word, file, index, ret.getWordPostion(word));
        })
        index += 1;
    });
}

function getStructInfo(data_p, line) {
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
        let variableName = getNameInLine(data_p[index], "variable", "one");
        if (!variableName.isMatch()) {
            lineNum += 1;
            continue;
        }
        let typeName = getNameInLine(data_p[index], "vtype", "one");
        if (!typeName.isMatch()) {
            lineNum += 1;
            continue;
        }
        if (!result.isKnownVariable(variableName.getFirstMatchWord())) {
            result.addTypeInfo(variableName.getFirstMatchWord(), typeName.getFirstMatchWord());
        }
        lineNum += 1;
    }
    result.setLineNums(lineNum);
    return result;
}

function getTypedefInfo(data_p, line, typeWord) {
    var typedefName = getNameInLine(data_p[line], "typedef", "one");
    if (typedefName.isMatch()) {
        if (data_p[line].search(";") !== -1) {
            let typeName = getNameInLine(data_p[line], "type", "one");
            if (typeName.isMatch()) {
                    definitionStore.addDefTypedefInfo(typeName.getFirstMatchWord(), typedefName.getFirstMatchWord());
                }
            }
        } else {
            let ret = getStructInfo(data_p, line);
            definitionStore.addDefTypeInfo(typeWord, ret);
            if (ret.getLineNums() !== 0) {
                var index = line + ret.getLineNums();
                var expr = "}\\s*[a-zA-Z0-9_<>]+(?=(\\s*;))";
                let typeName = doRegexSearch("}\\s*[a-zA-Z0-9_<>]+(?=(\\s*;))", data_p[index], "one");
                if (typeName.isMatch()) {
                    definitionStore.addDefTypedefInfo(typeName.getFirstMatchWord(), typedefName.getFirstMatchWord());
                }
            }
        }
}

function getAllParamsInDefinition(data_p, start_line, typeWord) {
    var line = start_line;
    if (data_p[line].search("typedef") !== -1) {
        getTypedefInfo(data_p, line, typeWord);
        return 1;
    } else if (data_p[line].search("struct") !== -1 || data_p[line].search("header") !== -1){
        var ret = getStructInfo(data_p, line);
        definitionStore.addDefTypeInfo(typeWord, ret);
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
        var typeName = null;
        typeName = getNameInLine(data_p[index], "define_type");
        let skipLine = 1;
        if (typeName.isMatch()) {
            skipLine = getAllParamsInDefinition(data_p, index, typeName.getFirstMatchWord());
        }
        index += skipLine;
    }
}

function definitionSync(uri) {
    console.log(definitionStore);
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

function searchDefinition(data, word) {
    var ret = getNameInLine(data, "define", "all");
    return ret.getWordPostion(word);
}

function searchType(data) {
    var ret = getNameInLine(data, "vtype", "all");
    return ret.getFirstMatchWord();
}

function searchVariable(data, word) {
    var ret = getNameInLine(data, "variable", "all");
    return ret.getWordPostion(word);
}

function findDefinitionsInCurFile(document, position, word) {
    var line = position.line - 1;
    while (line >= 0) {
        var line_text = document.lineAt(line);
        var column = searchVariable(line_text.text, word);
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
        column = searchDefinition(line, word);
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
    var failed = false;
    let ret = findDefinitionsInCurFile(document, position, words[0]);
    if (ret === null) {
        return null;
    }
    let typeName = searchType(document.lineAt(ret[1].line).text);
    if (typeName === null) {
        return null;
    }
    if (definitionStore.isKnownDefTypedef(typeName)) {
        typeName = definitionStore.getDefTypedef(typeName);
    }
    if (!definitionStore.isKnownDefType(typeName)) {
        return null;
    }
    typeInfo = definitionStore.getDefType(typeName);
    words.shift();
    words.some( word => {
        if (!typeInfo.isKnownVariable(word)) {
            typeInfo = null;
            return true;
        }
        typeName = typeInfo.getTypeName(word);
        if (definitionStore.isKnownDefTypedef(typeName)) {
            typeName = definitionStore.getDefTypedef(typeName);
        }
        if (!definitionStore.isKnownDefType(typeName)) {
            typeInfo = null;
            return true;
        }
        typeInfo = definitionStore.getDefType(typeName);
    })
    return typeInfo;
}

exports.findDefinitionsInSync = findDefinitionsInSync;
exports.findDefinitionsInAllFile = findDefinitionsInAllFile;
exports.findDefinitionsInCurFile = findDefinitionsInCurFile;

exports.definitionSync = definitionSync;
exports.getDefinitionCompletionItem = getDefinitionCompletionItem;