// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defpro = require('./definitionProcess');

function provideReferences(document, position, context, token) {
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
    context.subscriptions.push(vscode.languages.registerReferenceProvider(['p4'], {provideReferences}));
};