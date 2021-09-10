
// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const util = require('./util');
const defexpr = require('./definitionExpr');
const defProH = require('./definitionProcessDefs');

let defStore = new defProH.CdefStore();
let fileRelation = new defProH.CfileRelation();
let CregexSearchResult = defProH.CregexSearchResult;
let refStore = new defProH.CrefStore();

function doRegexSearch(exp, string, search_mode) {
    var searchResult = new CregexSearchResult();
    var result;
    if (search_mode === "all") {
        var regex = new RegExp(exp, "g");
        while ((result = regex.exec(string)) !== null) {
            searchResult.addResult(result[0], result.index);
        }
    } else {
        var regex = new RegExp(exp);
        if ((result = regex.exec(string)) !== null) {
            searchResult.addResult(result[0], result.index);
        }
    }
    return searchResult;
}

function getNameInLine(lineText, search_type, expr) {
    var retval = new CregexSearchResult();
    expr.forEach(exp => {
        retval.combineResult(doRegexSearch(exp, lineText, search_type));
    });
    return retval;
}

function getSdkFuncInfo(file, data_p, lineNum) {
    var structInfo = new defProH.CstructInfo();
    var op = 0;
    var set = false;
    let line = data_p[lineNum];
    if (line.search("{") !== -1) {
        op += 1;
        set = true;
    }
    if (line.search(";") !== -1) {
        structInfo.setStructLineNum(1);
        return structInfo;
    }
    lineNum += 1;
    var i = lineNum;
    for (i = lineNum; i < data_p.length; i++) {
        if (data_p[i].search("{") !== -1) {
            op += 1;
            set = true;
        } else if(data_p[i].search("}") !== -1){
            op -= 1;
        }
        if (op === 0 && set) {
            i++;
            break;
        }
        let ret = getNameInLine(data_p[i], "one", defexpr.sdk_func_exp);
        if (!ret.isMatch()) {
            continue;
        }
        let funcName = ret.getOneMatch();
        let character = ret.getOneCharacter();
        let defDetail = new defProH.CdefDetail();
        defDetail.setPosition(new defProH.CPosition(file, i, character))
        defDetail.setDefType("sdk_func");
        structInfo.addElememtDetail(funcName, defDetail);
    }
    structInfo.setStructLineNum(i - lineNum);
    return structInfo;
}

function getStructureInfo(file, data_p, lineNum, defType) {
    var structInfo = new defProH.CstructInfo();
    var op = 0;
    var set = false;
    let line = data_p[lineNum];
    if (line.search("{") !== -1) {
        op += 1;
        set = true;
    }
    lineNum += 1;
    var i = lineNum;
    for (i = lineNum; i < data_p.length; i++) {
        if (data_p[i].search("{") !== -1) {
            op += 1;
            set = true;
        } else if(data_p[i].search("}") !== -1){
            op -= 1;
        }
        if (op === 0 && set) {
            i++;
            break;
        }
        let ret = getNameInLine(data_p[i], "one", defexpr.variable_exp);
        if (!ret.isMatch()) {
            continue;
        }
        let variableName = ret.getOneMatch();
        let variableCharacter = ret.getOneCharacter();
        ret = getNameInLine(data_p[i], "one", defexpr.variable_type_exp);
        if (!ret.isMatch()) {
            continue;
        }
        let variableTypeName = ret.getOneMatch();
        let defDetail = new defProH.CdefDetail();
        defDetail.setPosition(new defProH.CPosition(file, i, variableCharacter))
        defDetail.setVariableType(variableTypeName);
        defDetail.setDefType("variable");
        structInfo.addElememtDetail(variableName, defDetail);
    }
    structInfo.setStructLineNum(i - lineNum);
    if (defType === "header") {
        structInfo.addElememtDetail("isValid()", null);
        structInfo.addElememtDetail("setValid()", null);
        structInfo.addElememtDetail("setInvalid()", null);
    }
    return structInfo;
}

function getEnumInfo(file, data_p, lineNum) {
    var structInfo = new defProH.CstructInfo();
    var op = 0;
    var set = false;
    let line = data_p[lineNum];
    let enumValue = 0;
    if (line.search("{") !== -1) {
        op += 1;
        set = true;
    }
    lineNum += 1;
    var i = lineNum;
    for (i = lineNum; i < data_p.length; i++) {
        if (data_p[i].search("{") !== -1) {
            op += 1;
            set = true;
        } else if(data_p[i].search("}") !== -1){
            op -= 1;
        }
        if (op === 0 && set) {
            i++;
            break;
        }
        let ret = getNameInLine(data_p[i], "one", defexpr.enum_variable_exp);
        if (!ret.isMatch()) {
            continue;
        }
        let enumVariable = ret.getOneMatch();
        let character = ret.getOneCharacter();
        ret = getNameInLine(data_p[i], "one", defexpr.enum_value_exp);
        if (ret.isMatch()) {
            enumValue = parseInt(ret.getOneMatch());
        }
        let defDetail = new defProH.CdefDetail();
        defDetail.setPosition(new defProH.CPosition(file, i, character))
        defDetail.setDefType("enum_variable");
        defDetail.setMeta(enumValue);
        structInfo.addElememtDetail(enumVariable, defDetail);
        enumValue += 1;
    }
    structInfo.setStructLineNum(i - lineNum);
    return structInfo;
}

function generateCommonDefDetail(file, lineNum, character, defType) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    defDetail.setDefType(defType);
    defDetail.setPosition(position);
    return defDetail;
}

function generateTablecDefDetail(file, lineNum, character) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    let structInfo = new defProH.CstructInfo();
    structInfo.addElememtDetail("apply()", null);
    structInfo.addElememtDetail("hit", null);
    defDetail.setDefType("table");
    defDetail.setPosition(position);
    defDetail.setStructInfo(structInfo);
    return defDetail;
}

function generateFuncDefDetail(file, lineNum, character) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    let structInfo = new defProH.CstructInfo();
    structInfo.addElememtDetail("apply()", null);
    defDetail.setDefType("function");
    defDetail.setPosition(position);
    defDetail.setStructInfo(structInfo);
    return defDetail;
}

function generateSdkDefDetail(file, lineNum, character, data_p) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    let structInfo = getSdkFuncInfo(file, data_p, lineNum);
    defDetail.setDefType("sdk_obj");
    defDetail.setPosition(position);
    defDetail.setStructInfo(structInfo);
    return defDetail;
}

function generateVariableDefDetail(file, lineNum, character, typeName) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    defDetail.setDefType("variable");
    defDetail.setVariableType(typeName);
    defDetail.setPosition(position);
    return defDetail;
}

function generateAliasDefDetail(file, lineNum, character, originName) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    defDetail.setDefType("alias");
    defDetail.setOriginName(originName);
    defDetail.setPosition(position);
    return defDetail;
}

function generateStructDefDetail(file, lineNum, character, data_p, defType) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    let structInfo = getStructureInfo(file, data_p, lineNum, defType);
    defDetail.setDefType(defType);
    defDetail.setPosition(position);
    defDetail.setStructInfo(structInfo);
    return defDetail;
}

function generateEnumDefDetail(file, lineNum, character, data_p) {
    let defDetail = new defProH.CdefDetail();
    let position = new defProH.CPosition(file, lineNum, character);
    let structInfo = getEnumInfo(file, data_p, lineNum);
    defDetail.setDefType("enum");
    defDetail.setPosition(position);
    defDetail.setStructInfo(structInfo);
    return defDetail;
}

function getMultiLineVariableNameAndLine(lineNum, data_p) {
    var pairs = 1;
    for (var i = lineNum + 1; i < data_p.length; i++) {
        if (data_p[i].search("\\(") !== -1 ) {
            pairs++;
        }
        if (data_p[i].search("\\)") !== -1 ) {
            pairs--;
        }
        if (pairs === 0) {
            let ret = getNameInLine(data_p[i], "one", defexpr.multi_line_variable_expr);
            if (ret.isMatch()) {
                return [ret.getOneMatch(), i, ret.getOneCharacter()];
            }
            ret = getNameInLine(data_p[i + 1], "one", defexpr.multi_line_variable_expr);
            if (ret.isMatch()) {
                return [ret.getOneMatch(), i + 1, ret.getOneCharacter()];
            }
            return [null, 0, 0];
        }
    }
    return [null, 0, 0];
}

function getDefinitionsInFile(file) {
    var ret = null;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    var skip = 1;
    for (var lineNum = 0; lineNum < data_p.length; lineNum+=skip) {
        let line = data_p[lineNum];
        skip = 1;
        ret = getNameInLine(line, "one", defexpr.anti_exp);
        if (ret.isMatch()) {
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.include_exp);
        if (ret.isMatch()) {
            fileRelation.addFileRelation(file, path.join(path.dirname(file),ret.getOneMatch()))
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.state_exp);
        if (ret.isMatch()) {
            let defDetail = generateCommonDefDetail(file, lineNum, ret.getOneCharacter(), "state");
            defStore.addDef(ret.getOneMatch(), defDetail);
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.table_exp);
        if (ret.isMatch()) {
            let defDetail = generateTablecDefDetail(file, lineNum, ret.getOneCharacter());
            defStore.addDef(ret.getOneMatch(), defDetail);
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.func_exp);
        if (ret.isMatch()) {
            let defDetail = generateFuncDefDetail(file, lineNum, ret.getOneCharacter());
            defStore.addDef(ret.getOneMatch(), defDetail);
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.define_exp);
        if (ret.isMatch()) {
            let defDetail = generateCommonDefDetail(file, lineNum, ret.getOneCharacter(), "define");
            defStore.addDef(ret.getOneMatch(), defDetail);
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.sdk_obj_exp);
        if (ret.isMatch()) {
            let defDetail = generateSdkDefDetail(file, lineNum, ret.getOneCharacter(), data_p);
            defStore.addDef(ret.getOneMatch(), defDetail);
            skip = defDetail.getStructInfo().getStructLineNum();
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.alias_exp);
        if (ret.isMatch()) {
            let ret2 = getNameInLine(line, "one", defexpr.origin_exp);
            if (ret2.isMatch()) {
                let defDetail = generateAliasDefDetail(file, lineNum, ret.getOneCharacter(), ret2.getOneMatch());
                defStore.addDef(ret.getOneMatch(), defDetail);
            }
        }
        ret = getNameInLine(line, "all", defexpr.variable_exp);
        if (ret.isMatch()) {
            let ret2 = getNameInLine(line, "all", defexpr.variable_type_exp);
            if (ret.getMatchNum() === ret2.getMatchNum()) {
                for (var i = 0; i < ret.getMatchNum(); i++) {
                    let variableName = ret.getMatchByIndex(i);
                    let variableCharacter = ret.getCharacterByIndex(i);
                    let variableTypeName = ret2.getMatchByIndex(i);
                    let defDetail = generateVariableDefDetail(file, lineNum, variableCharacter, variableTypeName);
                    defStore.addDef(variableName, defDetail);
                }
                continue;
            }
        }
        ret = getNameInLine(line, "one", defexpr.struct_exp);
        if (ret.isMatch()) {
            let defDetail = generateStructDefDetail(file, lineNum, ret.getOneCharacter(), data_p, "struct");
            defStore.addDef(ret.getOneMatch(), defDetail);
            skip = defDetail.getStructInfo().getStructLineNum();
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.header_exp);
        if (ret.isMatch()) {
            let defDetail = generateStructDefDetail(file, lineNum, ret.getOneCharacter(), data_p, "header");
            defStore.addDef(ret.getOneMatch(), defDetail);
            skip = defDetail.getStructInfo().getStructLineNum();
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.enum_exp);
        if (ret.isMatch()) {
            let defDetail = generateEnumDefDetail(file, lineNum, ret.getOneCharacter(), data_p);
            defStore.addDef(ret.getOneMatch(), defDetail);
            skip = defDetail.getStructInfo().getStructLineNum();
            continue;
        }
        ret = getNameInLine(line, "one", defexpr.multi_line_sdk_expr);
        if (ret.isMatch()) {
            let variableTypeName = ret.getOneMatch();
            let retval = getMultiLineVariableNameAndLine(lineNum, data_p);
            let variableName = retval[0];
            let variableNameLine = retval[1];
            let variableNameCharacter = retval[2];
            if (variableName !== null) {
                let defDetail = generateVariableDefDetail(file, variableNameLine, variableNameCharacter, variableTypeName);
                defStore.addDef(variableName, defDetail);
                skip = variableNameLine - lineNum + 1;
            }
            continue;
        }
    }
}

function getReferencesInFile(file) {
    var ret = null;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    for (var lineNum = 0; lineNum < data_p.length; lineNum++) {
        let line = data_p[lineNum];
        ret = getNameInLine(line, "one", defexpr.ref_exp);
        if (ret.isMatch()) {
            ret.getAllMatch().forEach( match => {
                var refPos = new defProH.CPosition(file, lineNum, ret.getCharacter(match));
                refStore.addRef(match, refPos);
            });
        }
    }
}

function definitionSync(uri) {
    vscode.window.setStatusBarMessage('Synchronizing...');
    defStore.clear();
    var workDir = null;
    if (!uri) {
        workDir = util.getProjectPath();
        if (!workDir) {
            vscode.window.showInformationMessage('Synchronizing Failed, Try Command In Right Click.');
            return;
        }
    } else if (uri.path.search("\\.") !== -1){
        workDir = path.dirname(uri.fsPath);
    } else {
        workDir = uri.fsPath;
    }
    var files = fs.readdirSync(workDir);
    files.forEach(file => {
        var s1 = file.substr(0,1);
        var s2 = file.substr(-3,3);
        if (s1 !== "." && s2 === ".p4") {
            getDefinitionsInFile(path.join(workDir, file));
            getReferencesInFile(path.join(workDir, file));
        }
    });
    console.log(defStore);
    vscode.window.setStatusBarMessage('Synchronize Done.');
}

function getCompletionRelationWords(document, position, word) {
    let line = document.lineAt(position.line).text;
    let exp = "\\b([a-zA-Z0-9_]+\\.)?" + word;
    let ret = doRegexSearch(exp, line, "all");
    if (!ret.isMatch()) {
        return null;
    }
    let match = ret.getLastMatch();
    ret.getAllMatch().forEach( str => {
        if (str.length + ret.getCharacter(str) - position.character <= word.length) {
            match = str;
        }
    });
    
    let words = match.split(".");
    return words;
}

function getRelationWords(document, position, word) {
    let line = document.lineAt(position.line).text;
    let exp = "([a-zA-Z0-9_]+\\.)+" + word;
    let ret = doRegexSearch(exp, line, "all");
    if (!ret.isMatch()) {
        return null;
    }
    let match = ret.getLastMatch();
    ret.getAllMatch().forEach( str => {
        if (str.length + ret.getCharacter(str) - position.character <= word.length) {
            match = str;
        }
    });
    let words = match.split(".");
    return words;
}

function getNearestDetail(defDetails, fileName, position) {
    var Oposition = new defProH.CPosition(fileName, position.line, position.character);
    var sameFileExists = false;
    var priority = 0xffffffff;
    var retval = null;
    defDetails.forEach(defDetail => {
        if (defDetail.getPosition().file === fileName) {
            sameFileExists = true;
        } else if (sameFileExists === true) {
            return;
        }
        var priorityTmp = defDetail.getPosition().compare(Oposition);
        if (priority < priorityTmp) {
            return;
        }
        priority = priorityTmp;
        retval = defDetail;
    });
    return retval;
}

function getDefNormal(fileName, word, position) {
    let defDetails = defStore.getDefByFileName(word, fileName);
    let retval = null;
    if (defDetails.length === 0) {
        let fileRelated = fileRelation.getFileRelation(fileName);
        if (fileRelated !== null) {
            fileRelated.some(relatedFile => {
                defDetails = defStore.getDefByFileName(word, relatedFile);
                if (defDetails.length !== 0) {
                    return true;
                }
            });
        }
    }
    if (defDetails.length !== 0) {
        retval = getNearestDetail(defDetails, fileName, position);
    }
    if (retval === null) {
        retval = defStore.getDefFirst(word);
    }
    return retval;
}

function findDefinitionsInStore(document, word, position) {
    var words = null;
    if ((words = getRelationWords(document, position, word)) !== null) {
        words.pop();
        let structInfo = getDefinitionCompletionItem(document, position, words);
        if (structInfo !== null) {
            if (structInfo.isElement(word)) {
                return structInfo.getElementDetail(word);
            }
            return null;
        }
        return null;
    } else {
        if (!defStore.isDef(word)) {
            return null;
        }
        if (!defStore.isDefMulti(word)) {
            return defStore.getDefFirst(word);
        }
        return getDefNormal(document.fileName, word, position);
    }
}

function findReferencesInStore(document, word, position) {
    if (!refStore.isRef(word)) {
        return null;
    }
    return refStore.getRef(word);
}

function getMultiCompletionElememtDetail(word) {
    let defDetails = defStore.getDefByDefType(word, "variable");
    if (defDetails.length !== 0) {
        return defDetails;
    }
    defDetails = defStore.getDefByDefType(word, "struct");
    if (defDetails.length !== 0) {
        return defDetails;
    }
    defDetails = defStore.getDefByDefType(word, "header");
    if (defDetails.length !== 0) {
        return defDetails;
    }
    defDetails = defStore.getDefByDefType(word, "function");
    if (defDetails.length !== 0) {
        return defDetails;
    }
    defDetails = defStore.getDefByDefType(word, "table");
    if (defDetails.length !== 0) {
        return defDetails;
    }
    return defStore.getDefAll(word);
}

function getCompletionElememtDetail(fileName, word, position) {
    if (!defStore.isDef(word)) {
        return null;
    }
    var defDetail = null;
    if (!defStore.isDefMulti(word)) {
        defDetail = defStore.getDefFirst(word);
    } else {
        let defDetails = getMultiCompletionElememtDetail(word);
        if (defDetails.length > 1) {
            defDetail = getNearestDetail(defDetails, fileName, position);
        } else {
            defDetail = defDetails[0];
        }
    }
    return defDetail;
}

function getDefinitionCompletionItem(document, position, words) {
    let defDetail = getCompletionElememtDetail(document.fileName, words[0], position);
    if (defDetail === null) {
        return null;
    }
    if (defDetail.getDefType() === "variable") {
        defDetail = getCompletionElememtDetail(document.fileName, defDetail.getVariableType(), position);
    }
    words.shift();
    for (var i = 0; i < words.length; i++) {
        let word = words[i];
        if (!defDetail.getStructInfo().isElement(word)) {
            return null;
        }
        let defDetailInner = defDetail.getStructInfo().getElementDetail(word);
        if (defDetailInner === null) {
            if (i !== words.length - 1) {
                return null;
            }
            break;
        }
        let typeName = defDetailInner.getVariableType();
        defDetail = getCompletionElememtDetail(document.fileName, typeName, position);
        if (defDetail === null) {
            return null;
        }
    }
    return defDetail.getStructInfo();
}

exports.findDefinitionsInStore = findDefinitionsInStore;
exports.findReferencesInStore = findReferencesInStore;
exports.definitionSync = definitionSync;
exports.getDefinitionCompletionItem = getDefinitionCompletionItem;
exports.getCompletionRelationWords = getCompletionRelationWords;
