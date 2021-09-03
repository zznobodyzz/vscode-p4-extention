const vscode = require('vscode');
const path = require('path');
const fs = require('fs');
const defsync = require('./definitionsync');


/**
 * 鼠标悬停提示，当鼠标停在package.json的dependencies或者devDependencies时，
 * 自动显示对应包的名称、版本号和许可协议
 * @param {*} document 
 * @param {*} position 
 * @param {*} token 
 */
function provideHover(document, position, token) {
    console.log('====== 进入 provideHover 方法 ======');
    const fileName    = document.fileName;
    const workDir     = path.dirname(fileName);
    const word        = document.getText(document.getWordRangeAtPosition(position));
    var ret = defsync.findDefinitionsInSync(word);
    if (ret !== null) {
        var data = fs.readFileSync(ret[0], 'utf8');
        var data_p = data.split('\n');
        return new vscode.Hover(data_p[ret[1]] + "\n" + data_p[ret[1] + 1] + "\n" + data_p[ret[1] + 2]);
    }
    console.log('cannot find definition');
    return new vscode.Hover("   ");
}

module.exports = function(context) {
    // 注册鼠标悬停提示
    context.subscriptions.push(vscode.languages.registerHoverProvider('p4', {
        provideHover
    }));
};