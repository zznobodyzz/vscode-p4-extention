// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defpro = require('./definitionProcess');

function provideDocumentSymbols(document, token) {
    let symbolStore = defpro.findSymbolsInStore(document.fileName);
    if (symbolStore.getSymbolNum() === 0) {
        return null;
    }
    var SymbolInformations = [];
    symbolStore.getSymbols().forEach( symbol => {
        let symbolInfos = symbolStore.getSymbol(symbol);
        if (symbolInfos.length !== 0) {
            symbolInfos.forEach(symbolInfo => {
                SymbolInformations.push(new vscode.SymbolInformation(symbol, symbolInfo.getSymbolKind(), symbolInfo.getRange(), symbolInfo.getContainer()))
            });
        }
    });
    return SymbolInformations;
}

module.exports = function(context) {
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(['p4'], {provideDocumentSymbols}));
};