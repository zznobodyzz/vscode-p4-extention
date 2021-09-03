const vscode = require('vscode');

exports.activate = function(context) {
    require('./goto')(context); // 跳转到定义
    require('./hover')(context); // 悬停提示
    console.log('p4-language-plugin loaded success');
};

exports.deactivate = function() {
    console.log('p4-language-plugin released')
};