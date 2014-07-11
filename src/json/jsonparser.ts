/// <reference path="../../types/node.d.ts" />

var greatjson = require("./greatjson.js");
import collections = require("../util/Collections");


class TextInfo {
    text: string;

    constructor(text: string) {
        this.text = text;
    }


    /**
     * taken from greatjson, its somewhat inefficient, doing a loop through the text each time
     */
    getLineColumn(position) {

        var result = {
            line: 1,
            column: 0
        };
        var n;
        var r;
        var lastColumn1 = 0;
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
        var lineCol = current_text.getLineColumn(position);
        this.col = lineCol.column;
        this.row = lineCol.line
    }
}

export class TextSpan {
    start: TextLocation;
    end: TextLocation;

    setStart(position) {
        this.start = new TextLocation(position);
    }
    setEnd(position) {
        this.start = new TextLocation(position);
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
}

export class JValue extends TextSpan{
    type: JType;
    constructor(type: JType) {
        super();
        this.type = type
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

    toString(): string {
        return this.value.toString()
    }
}

export class JBoolean extends JLiteral {
    constructor(value: boolean, start: number, end: number) {
        super(JType.JBoolean, value, start, end);
    }

}

export class JNumber extends JLiteral {
    constructor(value: number, start: number, end: number) {
        super(JType.JNumber, value, start, end);
    }
}

export class JString extends JLiteral {
    constructor(value: string, start: number, end: number) {
        super(JType.JString, value, start, end);
    }

}

export class JNull extends JLiteral {
    constructor(start: number, end: number) {
        super(JType.JNull, null, start, end);
    }
}

export class JArray extends JValue {
    elements: collections.LinkedList<JValue> = new collections.LinkedList<JValue>();

    push(val: JValue) {
        this.elements.add(val);
    }
}

export class JObject extends JValue {
    properties: collections.Dictionary<JString, JValue> = new collections.Dictionary<JString, JValue>();

    put(key: JString, val: JValue) {
        this.properties.setValue(key, val)
    }
}

export function parse(text: string) {
    current_text = new TextInfo(text);
    return greatjson.parse(text)
}

