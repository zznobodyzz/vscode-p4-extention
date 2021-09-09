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

function provideReference(document, position, context, token) {
    console.log("1111111111");
    const word = document.getText(document.getWordRangeAtPosition(position));
    var refPositions;

    refPositions = defpro.findReferencesInStore(document, word, position);
    if (refPositions.length === 0) {
        return null;
    }
    return refPositions.map(refPosition => {
         return new vscode.Location(vscode.Uri.file(refPosition.file), refPosition.position);
    });
}

module.exports = function(context) {
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['p4'], provideDefinition));
    context.subscriptions.push(vscode.languages.registerReferenceProvider(['p4'], provideReference));
    context.subscriptions.push(vscode.commands.registerCommand('p4.synchronize', defpro.definitionSync));
};