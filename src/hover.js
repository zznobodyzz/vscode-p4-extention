// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defsync = require('./definitionSync');

const goto = require('./goto');


/**
 * 鼠标悬停提示
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 */
function provideHover(document, position, token) {
    const fileName    = document.fileName;
    const workDir     = path.dirname(fileName);
    const word        = document.getText(document.getWordRangeAtPosition(position));
    var ret = defsync.findDefinitionsInSync(word);
    if (ret !== null) {
        var data = fs.readFileSync(ret[0], 'utf8');
        var data_p = data.split('\n');
        return new vscode.Hover(data_p[ret[1]] + "\n" + data_p[ret[1] + 1] + "\n" + data_p[ret[1] + 2]);
    }
    return new vscode.Hover("   ");
}

module.exports = function(context) {
    // 注册鼠标悬停提示
    context.subscriptions.push(vscode.languages.registerHoverProvider('p4', {
        provideHover
    }));
};