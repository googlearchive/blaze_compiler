/// <reference path="../types/node.d.ts" />
require('source-map-support').install();
var falafel = require("falafel");

/**
 * rewrites the javascript to remove redundant parenthesis and white space
 */
export function simplify(javascript_str: string):string{
    var simplify_fn = function(node){
        node.precedence = 1000; //default precedence for all nodes other than operator nodes, e.g. terminals
        if(node.type == "BinaryExpression" || node.type == "BooleanExpression" || node.type == "LogicalExpression"){
            node.precedence = js_precedence(node.operator); //overwrite with actual precedence
            var LHS:any, RHS:any;
            if(node.left.precedence >= node.precedence){
                LHS = node.left.source(); //LHS is already strongly bound
            }else if(node.left.precedence < node.precedence){
                LHS = "("+node.left.source()+")"; //LHS is not strongly bound, boost with brackets
            }

            if(node.right.precedence == node.precedence && isCommunicativeUniquePrecedence(node.operator)){
                //special case for communicative operators
                RHS = node.right.source();
            }else if(node.right.precedence > node.precedence){
                //NOTE: > NOT >=
                RHS = node.right.source(); //RHS is already strongly bound
            }else if(node.right.precedence <= node.precedence){
                RHS = "("+node.right.source()+")"; //RHS is not strongly bound, boost with brackets
            }
            node.update(LHS + node.operator + RHS);
        }
    };

    return falafel(javascript_str.toString(), {}, simplify_fn).toString();
}

var singleQuoteRegex = new RegExp("'", "g");
/**
 * backslash is inserted before every single quote, intended to be run within a string context
 */
export function escapeSingleQuotes(string_literal: string): string {
    string_literal = string_literal.replace(singleQuoteRegex, "\\'");
    return string_literal
}

var escapeRegex = new RegExp("\\\\", "g");
/**
 * backslash is inserted before every backslash, intended to be run within a string context, when placing an existing
 * escaped string within another
 */
export function escapeEscapes(string_literal: string): string {
    string_literal = string_literal.replace(escapeRegex, "\\\\");
    return string_literal
}

/**
 * changes double quotes to single quotes
 * might have been easier just to escape the existing double quotes
 */
export function sanitizeQuotes(javascript_str: string) {
    var simplify_fn = function(node){
        if (node.type == "Literal") {
            //double quoted string needs to be changed to single quotes
            if (node.raw.indexOf('"') == 0) node.update("'" + escapeSingleQuotes(node.value) + "'")
        }
    };

    return falafel(javascript_str.toString(), {}, simplify_fn).toString();
}

var isCommunicativeUniquePrecedence = function(token:string):boolean{
    switch (token) {
        case '||':
        case '&&':
        case '&':
        case '|':
            return true;
        default:
            return false;
    }
};

/**
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
 * Precedence in retrieved from esprima source function "binaryPrecedence"
 */
var js_precedence =  function(token:string):number {
    switch (token) {
        case '||':
            return 1;
        case '&&':
            return 2;
        case '|':
            return 3;
        case '^':
            return 4;
        case '&':
            return 5;
        case '==':
        case '!=':
        case '===':
        case '!==':
            return 6;
        case '<':
        case '>':
        case '<=':
        case '>=':
        case 'instanceof':
            return 7;
        case '<<':
        case '>>':
        case '>>>':
            return 8;
        case '+':
        case '-':
            return 9;
        case '*':
        case '/':
        case '%':
            return 11;
        default:
            return 0;
    }
};