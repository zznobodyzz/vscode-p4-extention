
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const readline = require('readline');

const match_exp = ['(?<=(action|control|table|state)\\s+)[a-zA-Z0-9_]+(?=(\\s*[;(]?))',
                    '(?<=(#define\\s))[a-zA-Z0-9_]+',
                    '(?<=((int|bool|bit<.*>)\\s+))[a-zA-Z0-9_]+(?=(\\s*[;,\\)]\\s*))',
                    '(?<=((header|struct)\\s+))[a-zA-Z0-9_]+(?=(\\s*))',
                    '(?<=((Register|RegisterAction|Hash|Resubmit|Mirror|Counter|ActionSelector).*))\\s[a-zA-Z0-9_]+(?=(\\s*;))',
                    '(?<=([a-zA-Z0-9_]+(\\[[0-9]+\\])?\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))'];

var definitionStore = {};

function findDefinitionsInSync(word) {
    console.log('====== 进入 findDefinitionsInSync 方法 ======');
    if (definitionStore.hasOwnProperty(word)) {
        return definitionStore[word];
    }
    return null;
}

function getDefinitionsInFile(file) {
    console.log('====== 进入 getDefinitionsInFile 方法 ======');
    console.log('read file: ' + file);
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    data_p.forEach(line => {
        console.log("finding in line: " + index);
        console.log("text: " + line);
        match_exp.forEach(exp => {
            var regex = new RegExp(exp, 'g');
            var result;
            while ((result = regex.exec(line)) !== null) {
                console.log("find: " + result[0] + " at: " + result.index);
                definitionStore[result[0]] = [file, index, result.index];
            }
        })
        index += 1;
    });
}

function definitionSync(uri) {
    console.log('====== 进入 definitionSync 方法 ======');
    vscode.window.showInformationMessage('Synchronizing...');
    const workDir     = path.dirname(uri.path.substr(1));
    console.log('workDir: ' + workDir);
    var files = fs.readdirSync(workDir);
    console.log(files);
    var ret = null;
    var retTmp = null;
    files.forEach(file => {
        var s1 = file.substr(0,1);
        var s2 = file.substr(-3,3);
        if (s1 !== "." && s2 === ".p4") {
            getDefinitionsInFile(path.join(workDir, file));
        }
    });
    vscode.window.showInformationMessage('Synchronize Done');
}

exports.findDefinitionsInSync = findDefinitionsInSync;
exports.definitionSync = definitionSync;