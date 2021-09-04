
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
const match_exp = defexpr.definition_match_expr;

var definitionStore = {};

function findDefinitionsInSync(word) {
    if (definitionStore.hasOwnProperty(word)) {
        return definitionStore[word];
    }
    return null;
}

function getDefinitionsInFile(file) {
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    data_p.forEach(line => {
        match_exp.forEach(exp => {
            var regex = new RegExp(exp, 'g');
            var result;
            while ((result = regex.exec(line)) !== null) {
                definitionStore[result[0]] = [file, index, result.index];
            }
        })
        index += 1;
    });
}

function definitionSync(uri) {
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
        }
    });
    vscode.window.setStatusBarMessage('Synchronize Done');
}

exports.findDefinitionsInSync = findDefinitionsInSync;
exports.definitionSync = definitionSync;