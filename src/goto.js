// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defpro = require('./definitionProcess');

function provideDefinition(document, position, token) {
    const fileName    = document.fileName;
    const workDir     = path.dirname(fileName);
    const word        = document.getText(document.getWordRangeAtPosition(position));
    const line        = document.lineAt(position);
    var position_out;

    position_out = defpro.findDefinitionsInSync(document, word, position);
    if (position_out === null) {
        position_out = defpro.findDefinitionsInCurFile(document, position, word);
        if (position_out === null) {
            position_out = defpro.findDefinitionsInAllFile(workDir, fileName, word);
            if (position_out === null) {
                return null;
            }
        }
    }
    return new vscode.Location(vscode.Uri.file(position_out[0]), position_out[1]);
}

module.exports = function(context) {
    context.subscriptions.push(vscode.languages.registerDefinitionProvider(['p4'], {
        provideDefinition
    }));
    context.subscriptions.push(vscode.commands.registerCommand('p4.synchronize', function(uri) {
        defpro.definitionSync(uri);
    }));
};