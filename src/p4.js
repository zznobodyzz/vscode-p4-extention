// @ts-ignore
const vscode = require('vscode');
const defpro = require('./definitionProcess');

exports.activate = function(context) {
    require('./goto')(context); // 跳转到定义
    require('./hover')(context); // 悬停提示
    require('./completion')(context); // 自动补全
    vscode.window.setStatusBarMessage('');
    defpro.definitionSync(vscode.workspace.workspaceFolders[0].uri);
    vscode.window.setStatusBarMessage('Welcome To P4 Extention!  Synchronize Done.');
};

exports.deactivate = function() {
};