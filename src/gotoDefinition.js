// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defpro = require('./definitionProcess');

function provideDefinition(document, position, token) {
    const word = document.getText(document.getWordRangeAtPosition(position));
    var defDetail;

    defDetail = defpro.findDefinitionsInStore(document, word, position);
    if (defDetail === null) {
        return null;
    }
    return new vscode.Location(vscode.Uri.file(defDetail.getPosition().file), defDetail.getPosition().position);
}

module.exports = function(context) {
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['p4'], {provideDefinition}));
};