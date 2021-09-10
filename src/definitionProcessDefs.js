// @ts-ignore
const vscode = require('vscode');
// @ts-ignore
const path = require('path');

function CPosition(file, line, character) {
    this.file = file;
    this.line = line;
    this.character = character;
    this.position = new vscode.Position(line, character);

    this.isEqual = function(other) {
        return (path.basename(this.file) === path.basename(other.file) && this.line === other.line && this.character === other.character);
    }

    
    this.compare = function(other) {
        return Math.abs(other.line - this.line) + Math.abs(other.character - this.character);
    }
}

function CrefStore() {
    this.store = {};

    this.addRef = function(name, position) {
        if (!this.isRef(name)) {
            this.store[name] = [];
        }
        this.store[name].push(position);
    }

    this.isRef = function(name) {
        return (this.store[name] !== undefined);
    }

    this.getRef = function(name) {
        if (this.isRef(name)) {
            return this.store[name];
        }
        return [];
    }
}

function CsymbolInfo() {
    this.symbolKind = null;
    this.range = null;
    this.container = null;

    this.setSymbolKind = function(symbolKind) {
        this.symbolKind = symbolKind;
    }

    this.setRange = function(positionStart, length) {
        let positionEnd = new vscode.Position(positionStart.line, positionStart.character + length);
        this.range = new vscode.Range(positionStart, positionEnd);
    }

    this.setContainer = function(container) {
        this.container = container;
    }
    
    this.getSymbolKind = function() {
        return this.symbolKind;
    }

    this.getRange = function() {
        return this.range;
    }

    this.getContainer = function() {
        return this.container;
    }
}

function CsymbolStore() {
    this.store = {};

    this.addSymbol = function(name, symbolInfo) {
        if (!this.isSymbol(name)) {
            this.store[name] = [];
        }
        this.store[name].push(symbolInfo);
    }
    
    this.isSymbol = function(name) {
        return (this.store[name] !== undefined);
    }

    this.getSymbols = function() {
        return Object.keys(this.store);
    }

    this.getSymbol = function(name) {
        if (this.isSymbol(name)) {
            return this.store[name];
        }
        return null;
    }

    this.getSymbolNum = function() {
        return Object.keys(this.store).length;
    }
}

function CdefDetail() {
    this.position = null;
    this.defType = null;
    this.variableType = null;
    this.structInfo = null;
    this.originName = null;
    this.meta = null;

    this.setPosition = function(position) {
        this.position = position;
    }

    this.setMeta = function(meta) {
        this.meta = meta;
    }

    this.setDefType = function(defType) {
        this.defType = defType;
    }

    this.setVariableType = function(variableType) {
        this.variableType = variableType;
    }

    this.setStructInfo = function(structInfo) {
        this.structInfo = structInfo;
    }

    this.setOriginName = function(originName) {
        this.originName = originName;
    }

    this.getPosition = function() {
        return this.position;
    }

    this.getMeta = function() {
        return this.meta;
    }

    this.getDefType = function() {
        return this.defType;
    }

    this.getVariableType = function() {
        return this.variableType;
    }

    this.getStructInfo = function() {
        return this.structInfo;
    }

    this.getOriginName = function() {
        return this.originName;
    }

    this.isPositionEqual = function(position) {
        if (this.position === null) {
            return false;
        }
        return this.position.isEqual(position);
    }
}

function CstructInfo() {
    this.store = {};
    this.structLineNum = 0;

    this.addElememtDetail = function(variableName, defDetail) {
        this.store[variableName] = defDetail;
    }

    this.setStructLineNum = function(structLineNum) {
        this.structLineNum = structLineNum;
    }

    this.isElement = function(variableName) {
        if (this.store[variableName] === undefined) {
            return false;
        }
        return true;
    }

    this.getElementDetail = function(variableName) {
        if (this.isElement(variableName)) {
            return this.store[variableName];
        }
        return null;
    }

    this.getElements = function() {
        return Object.keys(this.store);
    }

    this.getStructLineNum = function() {
        return this.structLineNum;
    }
}

function CdefStore() {
    this.store = {};

    this.clear = function() {
        this.store = {};
    }

    this.isDef = function(name) {
        if (this.store[name] === undefined) {
            return false;
        }
        return true;
    }

    this.addDef = function(name, defDetail) {
        if (!this.isDef(name)) {
            this.store[name] = [];
        }
        this.store[name].push(defDetail);
    }

    this.getDefFirst = function(name) {
        if (this.isDef(name)) {
            return this.store[name][0];
        }
        return null;
    }

    this.getDefByPosition = function(name, position) {
        if (!this.isDef(name)) {
            return null;
        }
        let retval = null;
        this.store[name].some(defDetail => {
            if (defDetail.isPositionEqual(position)) {
                retval = defDetail;
                return true;
            }
        });
        return retval;
    }

    this.getDefByFileName = function(name, fileName) {
        if (!this.isDef(name)) {
            return [];
        }
        let retval = [];
        this.store[name].forEach(defDetail => {
            if (defDetail.getPosition().file === fileName) {
                retval.push(defDetail);
            }
        });
        return retval;
    }

    this.getDefByDefType = function(name, defitionType) {
        if (!this.isDef(name)) {
            return [];
        }
        let retval = [];
        this.store[name].forEach(defDetail => {
            if (defDetail.getDefType() === defitionType) {
                retval.push(defDetail);
            }
        });
        return retval;
    }

    this.isDefMulti = function(name) {
        if (!this.isDef(name)) {
            return false;
        }
        return (Object.keys(this.store[name]).length > 1);
    }

    this.getDefDetailAll = function(name) {
        if (!this.isDef(name)) {
            return [];
        }
        return this.store[name];
    }

    this.getDefAll = function() {
        return Object.keys(this.store);
    }
}

function CregexSearchResult() {
    this.result = {};

    this.isMatch = function() {
        return (Object.keys(this.result).length !== 0);
    }

    this.getMatchNum = function() {
        return Object.keys(this.result).length;
    }

    this.getOneMatch = function() {
        if (this.isMatch()) {
            return Object.keys(this.result)[0];
        }
        return null;
    }

    this.getMatchByIndex = function(index) {
        if (index >= this.getMatchNum()) {
            return null;
        }
        return Object.keys(this.result)[index];
    }

    this.getOneCharacter = function() {
        if (this.isMatch()) {
            return this.result[Object.keys(this.result)[0]];
        }
        return null;
    }

    this.getCharacterByIndex = function(index) {
        if (index >= this.getMatchNum()) {
            return null;
        }
        return this.result[Object.keys(this.result)[index]];
    }

    this.getLastMatch = function() {
        if (this.isMatch()) {
            let keys = Object.keys(this.result);
            return keys[keys.length - 1];
        }
        return null;
    }

    this.getLastCharacter = function() {
        if (this.isMatch()) {
            let keys = Object.keys(this.result);
            return this.result[keys[keys.length - 1]];
        }
        return null;
    }

    this.addResult = function(word, character) {
        this.result[word] = character;
    }

    this.combineResult = function(other) {
        var tmp = other.getResult();
        for (var key in tmp) {
            this.result[key] = tmp[key];
        }
    }

    this.getAllMatch = function() {
        return Object.keys(this.result);
    }

    this.getCharacter = function(word) {
        if (this.result.hasOwnProperty(word)) {
            return this.result[word];
        }
        return null;
    }

    this.getResult = function() {
        return this.result;
    }
}

function CfileRelation() {
    this.relationShip = {};

    this.isKnownFile = function(file) {
        if (this.relationShip[file] === undefined) {
            return false;
        }
        return true;
    }

    this.addFileRelation = function(file, relatedFile) {
        if (!this.isKnownFile(file)) {
            this.relationShip[file] = [];
        }
        this.relationShip[file].push(relatedFile);
    }

    this.getFileRelation = function(file) {
        if (this.isKnownFile(file)) {
            return this.relationShip[file];
        }
        return null;
    }
}

exports.CPosition = CPosition;
exports.CrefStore = CrefStore;
exports.CsymbolInfo = CsymbolInfo;
exports.CsymbolStore = CsymbolStore;
exports.CdefDetail = CdefDetail;
exports.CstructInfo = CstructInfo;
exports.CdefStore = CdefStore;
exports.CregexSearchResult = CregexSearchResult;
exports.CfileRelation = CfileRelation;