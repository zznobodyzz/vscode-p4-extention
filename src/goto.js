/**
 * 跳转到定义示例，本示例支持`package.json`中`dependencies`、`devDependencies`跳转到对应依赖包。
 */
const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
const defsync = require('./definitionsync');

const match_exp = ['(?<=(action|control|table|state)\\s+)[a-zA-Z0-9_]+(?=(\\s*[;(]?))',
                    '(?<=(#define\\s))[a-zA-Z0-9_]+',
                    '(?<=((int|bool|bit<.*>)\\s+))[a-zA-Z0-9_]+(?=(\\s*[;,\\)]\\s*))',
                    '(?<=((header|struct)\\s+))[a-zA-Z0-9_]+(?=(\\s*))',
                    '(?<=((Register|RegisterAction|Hash|Resubmit|Mirror|Counter|ActionSelector).*))\\s[a-zA-Z0-9_]+(?=(\\s*;))',
                    '(?<=([a-zA-Z0-9_]+(\\[[0-9]+\\])?\\s+))[a-zA-Z0-9_]+(?=(\\s*(\\=\\s?[a-zA-Z0-9_]+\\s*)?[;,\\)]))'];

function searchDefinition(data, word) {
    console.log('====== 进入 searchDefinition 方法 ======');
    console.log("match word: " + word);
    var ret = null;
    match_exp.some(exp => {
        var regex = new RegExp(exp, 'g');
        var result;
        while ((result = regex.exec(data)) !== null) {
            console.log("find: " + result[0] + " at: " + result.index);
            if (word === result[0]) {
                console.log("find match word!");
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
    console.log('====== 进入 findDefinitionsInCurFile 方法 ======');
    var line = position.line - 1;
    while (line >= 0) {
        console.log("finding in line: " + line);
        var line_text = document.lineAt(line);
        console.log("text: " + line_text.text);
        var column = searchDefinition(line_text.text, word);
        console.log("column: " + column);
        if ( column !== null ) {
            console.log("findDefinitionsInCurFile Success");
            return [line, column];
        }
        line -= 1;
    }
    return null;
}

function findDefinitionsInFile(file, word) {
    console.log('====== 进入 findDefinitionsInFile 方法 ======');
    console.log('read file: ' + file);
    var ret = null;
    var index = 0;
    var data = fs.readFileSync(file, 'utf8');
    var data_p = data.split('\n');
    data_p.some(line => {
        console.log("finding in line: " + index);
        console.log("text: " + line);
        var retTmp = searchDefinition(line, word);
        console.log("column: " + retTmp);
        if (retTmp !== null) {
            ret = [index, retTmp];
            return true;
        }
        index += 1;
    });
    return ret;
}

function findDefinitionsInAllFile(workDir, fileName, word) {
    console.log('====== 进入 findDefinitionsInAllFile 方法 ======');
    var files = fs.readdirSync(workDir);
    console.log(files);
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

    console.log('====== 进入 provideDefinition 方法 ======');
    console.log('fileName: ' + fileName); // 当前文件名
    console.log('workDir: ' + workDir); // 当前文件所在目录
    console.log('word: ' + word); // 当前光标所在单词
    console.log('line: ' + line.text); // 当前光标所在行

    position_out = defsync.findDefinitionsInSync(word);
    if (position_out !== null) {
        return new vscode.Location(vscode.Uri.file(position_out[0]), new vscode.Position(position_out[1], position_out[2]));
    }
    position_out = findDefinitionsInCurFile(document, position, word);
    if (position_out !== null) {
        return new vscode.Location(vscode.Uri.file(fileName), new vscode.Position(position_out[0], position_out[1]));
    }
    position_out = findDefinitionsInAllFile(workDir, fileName, word);
    if (position_out !== null) {
        return new vscode.Location(vscode.Uri.file(position_out[0]), new vscode.Position(position_out[1], position_out[2]));
    }
    return null;
}

module.exports = function(context) {
    // 注册如何实现跳转到定义，第一个参数表示仅对json文件生效
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['p4'], {
        provideDefinition
    }));
    context.subscriptions.push(vscode.commands.registerCommand('p4.synchronize', function(uri) {
        defsync.definitionSync(uri);
    }));
};