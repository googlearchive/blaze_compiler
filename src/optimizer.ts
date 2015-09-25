/// <reference path="../types/node.d.ts" />
require('source-map-support').install();
var falafel = require("falafel");

/**
 * You can visualize ASTs using http://esprima.org/demo/parse.html which is handy
 */

/**
 * We keep applying optimizations until the length of the code stops decreasing
 */
export function optimize(javascript_str: string): string {
    //return simplify(javascript_str);

    var current_length = javascript_str.length + 1;
    while (javascript_str.length < current_length) {
        current_length = javascript_str.length;
        var current = javascript_str;
        //optimize stages
        javascript_str = simplify(parentIsObjectCheckRemoval(clauseRepetitionElimination(childParentAnnihilation(pruneBooleanLiterals(javascript_str)))));
    }
    return current;
}

/**
 * optimizes and removes outer paranthesis, only safe for use in end user expressions, like .read or .write, where the parenthesis
 * cannot be doing anything useful.
 * @param javascript_str
 */
export function optimizeAndTrim(javascript_str: string): string {
    var optimized = optimize(javascript_str);
    optimized = optimized.replace(/^\(+true\)+$/, "true");
    optimized = optimized.replace(/^\(+false\)+$/,"false");
    return optimized;
}


var simplifyMemory: {[js: string]: string} = {};
/**
 * rewrites the javascript to remove redundant parenthesis and white space
 */
export function simplify(javascript_str: string):string {
    if (simplifyMemory[javascript_str]) return simplifyMemory[javascript_str];

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

    var result = falafel(javascript_str.toString(), {}, simplify_fn).toString();
    simplifyMemory[javascript_str] = result;
    return result;
}

var pruneBooleanLiteralsMemory: {[js: string]: string} = {};
/**
 * rewrites the javascript to remove pointless boolean literals like true && X
 */
export function pruneBooleanLiterals(javascript_str: string): string {
    if (pruneBooleanLiteralsMemory[javascript_str]) return pruneBooleanLiteralsMemory[javascript_str];
    var simplify_fn = function(node){
        if (node.type == "UnaryExpression") {
            //!true => false
            if (node.operator == '!' && node.argument.type == 'Literal') {
                node.update(!node.argument.value)
            }
        } else if(node.type == "LogicalExpression") {
            //helper functions for querying literal arguments
            node.left.is  = function(val) {return node.left.type == 'Literal' && node.left.value == val;};
            node.right.is = function(val) {return node.right.type == 'Literal' && node.right.value == val;};

            if (node.operator == '&&' && node.left.is(true) && node.right.is(true)) {
                node.update("true")
            } else if (node.operator == '&&' && node.left.is(false)) {
                node.update("false")
            } else if (node.operator == '&&' && node.right.is(false)) {
                node.update("false")
            } else if (node.operator == '&&' && node.left.is(true)) {
                node.update("("+node.right.source() + ")")
            } else if (node.operator == '&&' && node.right.is(true)) {
                node.update("("+node.left.source() + ")")
            } else if (node.operator == '||' && node.left.is(false) && node.right.is(false)) {
                node.update("false")
            } else if (node.operator == '||' && node.left.is(true)) {
                node.update("true")
            } else if (node.operator == '||' && node.right.is(true)) {
                node.update("true")
            } else if (node.operator == '||' && node.left.is(false)) {
                node.update("("+node.right.source() + ")")
            } else if (node.operator == '||' && node.right.is(false)) {
                node.update("("+node.left.source() + ")")
            }
        }
    };

    var result = falafel(javascript_str.toString(), {}, simplify_fn).toString();
    pruneBooleanLiteralsMemory[javascript_str] = result;
    return result;
}


var clauseRepetitionEliminationMemory: {[js: string]: string} = {};
/**
 * remove repeated clauses in && and || groups
 * note the order of lazy evaluation means the first occurrences ordering must be preserved!
 * a && b && c && c && b => a && b && c
 */
export function clauseRepetitionElimination(javascript_str: string): string {
    if (clauseRepetitionEliminationMemory[javascript_str]) return clauseRepetitionEliminationMemory[javascript_str];

    var simplify_fn = function(node){
        if(node.type == "LogicalExpression") {
            if (node.parent.type == "LogicalExpression" && node.parent.operator == node.operator) {
                //so the parent is part of the same group so we don't want to do the expensive optimization yet
            } else {
                //we are the top level logical expression, lets hunt for repetitions
                //the left pointer should be another logical expression
                //the right should be a single expression
                var operator = node.operator;
                var clauses = [];
                var logical = node;

                while (logical.type == "LogicalExpression" && logical.operator == operator) {
                    clauses.push(logical.right.source());
                    logical = logical.left;
                }
                clauses.push(logical.source()); //logical was the left of the previous seen logical expression
                var clauses = clauses.reverse(); //make the LHS first

                for (var primaryClause = 0; primaryClause < clauses.length; primaryClause++) {
                    for (var repeatClause = primaryClause + 1; repeatClause < clauses.length; repeatClause++) {
                        if (clauses[primaryClause] == clauses[repeatClause]) {
                            //secondaryClause repeats the primary clause, so delete it and adjust the indexing
                            clauses.splice(repeatClause,1);
                            repeatClause--; //adjustment for an element being removed during a loop
                        }
                    }
                }

                //now clauses should have no repeatitions and should be in the correct order LEFT to RIGHT
                node.update(simplify("((" + clauses.join(")" + operator + "(") + "))"))

            }
        }
    };

    var result =  falafel(javascript_str.toString(), {}, simplify_fn).toString();
    clauseRepetitionEliminationMemory[javascript_str] = result;
    return result;
}

var childParentAnnihilationMemory: {[js: string]: string} = {};

/**
 * blah.child(XXX).parent().blah() => blah.blah() (if we don't include any other implementations of child)
 */
export function childParentAnnihilation(javascript_str: string): string {
    if (childParentAnnihilationMemory[javascript_str]) return childParentAnnihilationMemory[javascript_str];

/*
data.child('x').parent().val()
AST expansion looks like:-

{
    "type": "Program",
    "body": [
        {
            "type": "ExpressionStatement",
            "expression": {
                "type": "CallExpression",
                "callee": {
                    "type": "MemberExpression",  <--- start hunting here
                    "computed": false,
                    "object": {
                        "type": "CallExpression", <---- () of parent, this will be removed
                        "callee": {
                            "type": "MemberExpression",
                            "computed": false,
                            "object": {
                                "type": "CallExpression",
                                "callee": {
                                    "type": "MemberExpression",
                                    "computed": false,
                                    "object": { <--- kept
                                        "type": "Identifier",
                                        "name": "data"
                                    },
                                    "property": {
                                        "type": "Identifier",
                                        "name": "child"
                                    }
                                },
                                "arguments": [ <---- irrelavant
                                    {
                                        "type": "Literal",
                                        "value": "x",
                                        "raw": "'x'"
                                    }
                                ]
                            },
                            "property": {
                                "type": "Identifier",
                                "name": "parent"
                            }
                        },
                        "arguments": []
                    },
                    "property": {
                        "type": "Identifier",
                        "name": "val"
                    }
                },
                "arguments": []
            }
        }
    ]
}
*/
    var simplify_fn = function(node){
        //detect the above situation and rewrite
        if (node.type == 'MemberExpression' &&
            node.object.type == 'CallExpression' &&
            node.object.arguments.length == 0 &&
            node.object.callee.type == 'MemberExpression' &&
            node.object.callee.property.type == 'Identifier' &&
            node.object.callee.property.name == 'parent' &&
            node.object.callee.object.type == 'CallExpression' &&
            node.object.callee.object.callee.type == 'MemberExpression' &&
            node.object.callee.object.callee.property.type == 'Identifier' &&
            node.object.callee.object.callee.property.name == 'child') {

            //rewrite node
            node.object.update(node.object.callee.object.callee.object.source())
        }
    };

    var result = falafel(javascript_str.toString(), {}, simplify_fn).toString();
    childParentAnnihilationMemory[javascript_str] = result;
    return result;
}

var parentIsObjectCheckRemovalMemory: {[js: string]: string} = {};

var parent_pattern = /^!newData(\.parent\(\))+\.exists\(\)\|\|newData(\.parent\(\))+\.hasChildren\(\)$/;
export function parentIsObjectCheckRemoval(javascript_str: string) {
    if (parentIsObjectCheckRemovalMemory[javascript_str]) return parentIsObjectCheckRemovalMemory[javascript_str];

    //if on the top level && we are checking to see if our parent is an object or null, we are doing a redundant check because
    //we can only write either null, a primitive or an object at newData location
    //therefore our parent  will flip only to null, or an object, thus we don't need to check for this pattern

    //((!newData.parent().parent().parent().parent().parent().exists()||newData.parent().parent().parent().parent().parent().hasChildren())
    var simplify_fn = function(node){
        //detect the above situation and rewrite
        if (node.type == 'LogicalExpression' && node.operator == '||') {
            var match = parent_pattern.exec(node.source());
            if (match != null && match[1] == match[2]) { //check the number of ".parent()" match between exists and hasChildren
                node.update("true")
            }
        }
    };

    var result = falafel(javascript_str.toString(), {}, simplify_fn).toString();
    parentIsObjectCheckRemovalMemory[javascript_str] = result;
    return result;
}


var singleQuoteRegex = new RegExp("'", "g");
/**
 * backslash is inserted before every single quote, intended to be run within a string context
 */
export function escapeSingleQuotes(string_literal: string): string {
    string_literal = string_literal.replace(singleQuoteRegex, "\\'");
    return string_literal
}

var escapeRegex = new RegExp("\\\\", "g"); //detects a single backslash
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