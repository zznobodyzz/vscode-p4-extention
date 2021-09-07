// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defpro = require('./definitionProcess');

function provideHover(document, position, token) {
    const fileName    = document.fileName;
    const workDir     = path.dirname(fileName);
    const word        = document.getText(document.getWordRangeAtPosition(position));
    var ret = defpro.findDefinitionsInSync(document, word, position);
    if (ret !== null) {
        var data = fs.readFileSync(ret[0], 'utf8');
        var data_p = data.split('\n');
        return new vscode.Hover(data_p[ret[1].line]);
    }
    return new vscode.Hover(" ");
}

module.exports = function(context) {
    // 注册鼠标悬停提示
    context.subscriptions.push(vscode.languages.registerHoverProvider('p4', {
        provideHover
    }));
};