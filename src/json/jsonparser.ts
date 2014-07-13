/// <reference path="../../types/node.d.ts" />
require('source-map-support').install();
var greatjson = require("./greatjson.js");
import collections = require("../util/Collections");
import error = require('../error');

export class TextInfo {
    text: string;

    constructor(text: string) {
        this.text = text;
    }
    /**
     * taken from greatjson, its somewhat inefficient, doing a loop through the text each time
     */
    getLineColumn(position: number) {
        var result = {
            line: 1,
            column: 0
        };
        var n, r, lastColumn1 = 0;
        for (;;) {
            // find next '/n' and '/r'
            if (n == null && (n = this.text.indexOf('\n', lastColumn1)) >= position) n = -1;
            if (r == null && (r = this.text.indexOf('\r', lastColumn1)) >= position) r = -1;
            if (n == -1 && r == -1) break;

            // check if next linebreak is '/n'
            if (n != -1 && (n < r || r == -1)) {
                result.line++;
                lastColumn1 = n + 1;
                n = null
            } else if (r != -1 && (r < n || n == -1)) {
                result.line++;
                lastColumn1 = r + 1;
                if (n == r + 1) {
                    n = null;
                    lastColumn1++
                }
                r = null
            }
        }
        result.column = position - lastColumn1 + 1;

        return result
    }
}
var current_text: TextInfo;

/**
 *Facade for processing json, in particular, maintaining column and line numbers
 */

export class TextLocation {
    position: number;
    col: number;
    row: number;

    constructor(position: number) {
        this.position = position;
        if (current_text != null) {
            var lineCol = current_text.getLineColumn(position);
            this.col = lineCol.column;
            this.row = lineCol.line
        } else {
            console.error("no text document defined, this better running during testing!!!")
        }
    }
}

export class TextSpan {
    start: TextLocation;
    end: TextLocation;
    text: TextInfo;

    constructor(){
        this.text = current_text;
    }
    setStart(position) {
        this.start = new TextLocation(position);
    }
    setEnd(position) {
        this.end = new TextLocation(position);
    }

    source(): string {
        return this.text.text.slice(this.start.position, this.end.position);
    }
}

export enum JType {
  JBoolean,
  JNumber,
  JString,
  JNull,

  JValue,
  JPrimitive,
  JArray,
  JObject,
}

export class JValue extends TextSpan{
    type: JType;
    constructor(type: JType) {
        super();
        this.type = type
    }

    castError(target: JType): Error {
        return error.message([
            "Type error",
            this.source(),
            "cannot be cast from " + JType[this.type] + " to " + JType[target]
        ].join("\n")).on(new Error());
    }

    cast(target: JType): JValue {
        if(this.type == target) {
            return this;
        } else {
            throw this.castError(target)
        }
    }

    has(property_name: string): boolean { return false; }

    getOrThrow(property_name: string, error_msg: string): JValue {
        throw error.message(this + " is not an object -- " + error_msg).on(new Error());
    }

    asString(): JString {
        return <JString>this.cast(JType.JString)
    }
    asObject(): JObject {
        return <JObject>this.cast(JType.JObject)
    }
    asArray(): JArray {
        return <JArray>this.cast(JType.JArray)
    }
    asBoolean(): JBoolean {
        return <JBoolean>this.cast(JType.JBoolean)
    }
    asNumber(): JNumber {
        return <JNumber>this.cast(JType.JNumber)
    }
    coerceString(): JString {
        return <JString>this.cast(JType.JString)
    }

    toJSON(): any {throw error.message("not implemented").on(new Error()); }

    toString(): string {
        return JSON.stringify(this.toJSON())
    }

    /**
     * find the json that defines the given data path, as reported by TV4
     * e.g. /definitions/message
     */
    lookup(data_path: string[]): JValue {
        if(data_path[0] == "") data_path.shift();
        if (data_path.length == 0) return this;
        var child_lookup: string = data_path.shift();
        if (this.has(child_lookup)) {
            return this.getOrThrow(child_lookup, "").lookup(data_path);
        } else {
            throw error.source(this).message("has no property '" + child_lookup + "'").on(new Error());
        }
    }
}

export class JLiteral extends JValue {
    value: any;

    constructor(type: JType, value: any, start: number, end: number) {
        super(type);
        this.type = type;
        this.value = value;
        this.start = new TextLocation(start);
        this.end = new TextLocation(end);
    }
    toJSON(): any {
        return this.value;
    }
}

export class JBoolean extends JLiteral {
    value: boolean;
    constructor(value: boolean, start: number, end: number) {
        super(JType.JBoolean, value, start, end);
    }

    coerceString(): JString {
        return new JString(this.value + "", this.start.position, this.end.position);
    }
}

export class JNumber extends JLiteral {
    value: number;
    constructor(value: number, start: number, end: number) {
        super(JType.JNumber, value, start, end);
    }
}

export class JString extends JLiteral {
    value: string;
    constructor(value: string, start: number, end: number) {
        super(JType.JString, value, start, end);
    }

    getString(): string { return this.value;}
}

export class JNull extends JLiteral {
    constructor(start: number, end: number) {
        super(JType.JNull, null, start, end);
    }
}

export class JArray extends JValue {
    elements: collections.LinkedList<JValue> = new collections.LinkedList<JValue>();

    constructor() {
        super(JType.JArray)
    }


    push(val: JValue) {
        this.elements.add(val);
    }

    forEach(callback: (JValue) => void) {
        this.elements.forEach(function(val: JValue){
            callback(val);
            return true;
        });
    }
    forEachIndexed(callback: (JValue, number) => void) {
        var counter = 0;
        this.elements.forEach(function(val: JValue){
            callback(val, counter++);
            return true;
        });
    }

    toJSON(): any {
        var value_array = [];
        this.forEach(function(val: JValue){
            value_array.push(val.toJSON());
        });
        return value_array;
    }
}

function toKey(key: string): JString {
    return new JString(key, 0,0);
}

export class JObject extends JValue {
    properties: collections.Dictionary<JString, JValue> = new collections.Dictionary<JString, JValue>();

    constructor() {
        super(JType.JObject)
    }

    put(key: JString, val: JValue) {
        this.properties.setValue(key, val)
    }

    getOrThrow(property_name: string, error_msg: string): JValue{
        if (this.has(property_name)){
            return this.properties.getValue(toKey(property_name))
        } else {
            throw error.message(error_msg).on(new Error());
        }
    }

    getOrNull(property_name: string): JValue{
        if (this.has(property_name)){
            return this.properties.getValue(toKey(property_name))
        } else {
            return null;
        }
    }

    getOrWarn(property_name: string, warn_msg): JValue{
        if (this.has(property_name)){
            return this.properties.getValue(toKey(property_name))
        } else {
            console.error("Warning: " + this.source() + " " + warn_msg);
            return null;
        }
    }

    has(property_name: string): boolean {
        return this.properties.containsKey(toKey(property_name));
    }

    forEach(callback: (key: JString, val: JValue) => void) {
        this.properties.forEach(function(key: JString, val: JValue){
            callback(key, val);
        });
    }

    toJSON(): any {
        var value_object = {};
        this.properties.forEach(function(key: JString, val: JValue){
            value_object[key.value] = val.toJSON();
        });
        return value_object;
    }
}

export function parse(text: string): JValue{
    current_text = new TextInfo(text);
    return greatjson.parse(text)
}

