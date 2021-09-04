// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
// @ts-ignore
const readline = require('readline');
const defsync = require('./definitionSync');
const defexpr = require('./definitionExpr');
const match_exp = defexpr.definition_match_expr;

function searchDefinition(data, word) {
    var ret = null;
    match_exp.some(exp => {
        var regex = new RegExp(exp, 'g');
        var result;
        while ((result = regex.exec(data)) !== null) {
            if (word === result[0]) {
                ret = result.index;
                break;
            }
        }
        if (ret !== null) {
            return true;
        }
    })
    return ret;
}

function findDefinitionsInCurFile(document, position, word) {
    var line = position.line - 1;
    while (line >= 0) {
        var line_text = document.lineAt(line);
        var column = searchDefinition(line_text.text, word);
        if ( column !== null ) {
            return [document.fileName, line, column];
        }
        line -= 1;
    }
    return null;
}

function findDefinitionsInFile(file, word) {
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    data_p.some(line => {
        var retTmp = searchDefinition(line, word);
        if (retTmp !== null) {
            ret = [index, retTmp];
            return true;
        }
        index += 1;
    });
    return ret;
}

function findDefinitionsInAllFile(workDir, fileName, word) {
    var files = fs.readdirSync(workDir);
    var ret = null;
    var retTmp = null;
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
        retTmp = findDefinitionsInFile(path.join(workDir, file), word);
        if (retTmp !== null) {
            ret = [path.join(workDir, file), retTmp[0], retTmp[1]];
            return true;
        }
    });
    return ret;
}

function provideDefinition(document, position, token) {
    const fileName    = document.fileName;
    const workDir     = path.dirname(fileName);
    const word        = document.getText(document.getWordRangeAtPosition(position));
    const line        = document.lineAt(position);
    var position_out;

    position_out = defsync.findDefinitionsInSync(word);
    if (position_out === null) {
        position_out = findDefinitionsInCurFile(document, position, word);
        if (position_out === null) {
            position_out = findDefinitionsInAllFile(workDir, fileName, word);
            if (position_out === null) {
                return null;
            }
        }
    }
    return new vscode.Location(vscode.Uri.file(position_out[0]), new vscode.Position(position_out[1], position_out[2]));
}

module.exports = function(context) {
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['p4'], {
        provideDefinition
    }));
    context.subscriptions.push(vscode.commands.registerCommand('p4.synchronize', function(uri) {
        defsync.definitionSync(uri);
    }));
};