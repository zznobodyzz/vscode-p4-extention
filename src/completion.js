// @ts-ignore
const vscode = require('vscode');
const defpro = require('./definitionProcess');

var lastTypeString = null;
var lastCompletion = null;

function getSearchWords(lineText) {
    const expr = "\\b([a-zA-Z0-9_\\.]+)+"
    var regex = new RegExp(expr);
    var ret;
    var words = [];
    if ((ret = regex.exec(lineText)) !== null) {
        words = ret[0].split(".");
    }
    return words;
}

function provideCompletionItems(document, position, token, context) {
    const lineText = document.lineAt(position).text.substring(0, position.character);
    let variables = [];
    let lastCha = lineText.substr(lineText.length - 1);
    if (lastCha === ".") {
        let words = getSearchWords(lineText.substr(0, lineText.length - 1));
        var ret = defpro.getDefinitionCompletionItem(document, position, words);
        if (ret !== null) {
            variables = ret.getAllVariable();
            variables.sort();
            lastTypeString = lineText.substr(0, lineText.length - 1);
            lastCompletion = variables;
        }
    } else {
        let index = lineText.lastIndexOf(".");
        if (index !== -1) {
            if (lastTypeString === lineText.substr(0, index)) {
                let typeStr = lineText.substr(index + 1);
                lastCompletion.forEach(variable => {
                    if (variable.search(typeStr) !== -1) {
                        variables.push(variable);
                    }
                });
            }
        }
    }
    if (variables.length !== 0) {
        let completion = [];
        variables.forEach( variable => {
            completion.push(new vscode.CompletionItem(variable, vscode.CompletionItemKind.Variable));
        })
        return new vscode.CompletionList(completion, true);
    }
}

function resolveCompletionItem(item, token) {
    return null;
}

module.exports = function(context) {
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider('p4', {
        provideCompletionItems,
        resolveCompletionItem
    }, '.'));
};