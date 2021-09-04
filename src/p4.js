// @ts-ignore
const vscode = require('vscode');

exports.activate = function(context) {
    require('./goto')(context); // 跳转到定义
    require('./hover')(context); // 悬停提示
    vscode.window.setStatusBarMessage('welcome to use p4 extention');
};

exports.deactivate = function() {
};