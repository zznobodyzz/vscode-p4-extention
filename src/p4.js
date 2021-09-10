// @ts-ignore
const vscode = require('vscode');
const defpro = require('./definitionProcess');

exports.activate = function(context) {
    context.subscriptions.push(vscode.commands.registerCommand('p4.synchronize', function(uri) {defpro.definitionSync(uri);} ));
    require('./gotoDefinition')(context); // 跳转到定义
    require('./gotoReference')(context); // 跳转到引用
    require('./hover')(context); // 悬停提示
    require('./completion')(context); // 自动补全
    require('./symbol')(context); // outline索引
    defpro.definitionSync(vscode.workspace.workspaceFolders[0].uri);
    vscode.window.setStatusBarMessage('Welcome To P4 Extention!  Synchronize Done.');
};

exports.deactivate = function() {
};