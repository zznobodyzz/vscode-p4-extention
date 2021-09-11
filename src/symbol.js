// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');
// @ts-ignore
const fs = require('fs');
const defpro = require('./definitionProcess');

function generateDocumentSymbol(symbolInfo) {
    return new vscode.DocumentSymbol(symbolInfo.getSymbolName(), symbolInfo.getDefType(), symbolInfo.getSymbolKind(), symbolInfo.getRange(), symbolInfo.getRange());
}

function generateDocumentSymbols(symbolInfos) {
    var documentSymbols = [];
    symbolInfos.forEach( symbolInfo => {
        documentSymbols.push(new vscode.DocumentSymbol(symbolInfo.getSymbolName(), symbolInfo.getDefType(), symbolInfo.getSymbolKind(), symbolInfo.getRange(), symbolInfo.getRange()));
    });
    return documentSymbols;
}

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
                let documentSymbol = generateDocumentSymbol(symbolInfo);
                let childrens = symbolInfo.getChildren();
                if (childrens !== null) {
                    documentSymbol.children = generateDocumentSymbols(childrens);
                }
                SymbolInformations.push(documentSymbol);
            });
        }
    });
    return SymbolInformations;
}

module.exports = function(context) {
    context.subscriptions.push(vscode.languages.registerDocumentSymbolProvider(['p4'], {provideDocumentSymbols}));
};