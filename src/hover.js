// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defpro = require('./definitionProcess');

function provideHover(document, position, token) {
    const word        = document.getText(document.getWordRangeAtPosition(position));
    var defDetail = defpro.findDefinitionsInStore(document, word, position);
    if (defDetail !== null) {
        var data = fs.readFileSync(defDetail.getPosition().file, 'utf8');
        var data_p = data.split('\n');
        let lineContent = data_p[defDetail.getPosition().line];
        if (defDetail.getDefType() === "enum_variable") {
            lineContent += "enum value: " + defDetail.getMeta().toString();
        }
        return new vscode.Hover(lineContent);
    }
    return new vscode.Hover(" ");
}

module.exports = function(context) {
    // 注册鼠标悬停提示
    context.subscriptions.push(vscode.languages.registerHoverProvider('p4', provideHover));
};