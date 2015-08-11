/// <reference path="../types/node.d.ts" />
/// <reference path="../node_modules/source-processor/index.d.ts" />
require('source-map-support').install();
var falafel = require("falafel");

var XRegExp = require('xregexp').XRegExp;

import Json = require('source-processor');
import error = require('source-processor');
import optimizer = require('../src/optimizer');
import globals = require('../src/globals');

//todo
//implement explicit types rather than ad hoc string

export class Function {
    identifier: string; //the function name
    signature: string; //the function name, and the number of params, e.g. f(x) signature is f(0)
    parameter_map: {[pos:number]:string;};//maps the position of the param to a string value
    expression:  Expression;

    static DECLARATION_FORMAT = XRegExp(
        '(?<name>\\w+) \\s* # name is alphanumeric\n'+
        '\\( \\s*  #open brace for function args  \n'+
        '(?<paramlist> (\\w+\\s*(,\\s*\\w+\\s*)*)?) #comma seperated list of params\n'+
        '\\) \\s*  #close brace for function args \n',
        'gx');

    constructor(declaration: string, expression: Json.JString) {
        //break the function declaration into its parts
        var match = XRegExp.exec(declaration, Function.DECLARATION_FORMAT);
        var params = XRegExp.split(match.paramlist, /\s*,\s*/);

        //bug fix for weird split behaviour (preserved in XRegExp)
        //if the declaration has no parameters, the "paramlist" gets split as [''] for some reason
        if(params.length==1 && params[0] == '') params = []; //convert it to empty list as it should be

        this.identifier = match.name;
        this.signature = match.name + "(" + params.length + ")";

        //now build up positional information of params
        this.parameter_map = params;

        this.expression = Expression.parseUser(expression);
    }

    static parse(json: Json.JValue): Function {
        //console.log("Function.parse:", json);
        var fun: Function;

        //there should only be one entry
        json.asObject().forEach(function(key: Json.JString, val: Json.JValue) {
             fun = new Function(key.asString().value, val.coerceString());
        });

        return fun
    }
}

/**
 * instances support indexing like arrays, which maps cannocal function declarations to Function definitions
 */
export class Functions {
    [index: string]: Function;

    static parse(json: Json.JValue): Functions{
        //console.log("Functions.parse:", json);
        var functions = new Functions();
        if (json == null) return functions;

        json.asArray().forEach(function(val: Json.JValue) {
            var fun: Function = Function.parse(val);
            functions[fun.identifier] = fun;
        });
        return functions
    }
}

export class Symbols{
    functions: {[index: string]: Function} = {};
    variables: {[index: string]: any}      = {}; //string->AST node

    clone():Symbols{
        var clone: Symbols =  new Symbols();
        for(var p in this.functions) clone.functions[p] = this.functions[p];
        for(var v in this.variables) clone.variables[v] = this.variables[v];
        return clone;
    }

    loadFunction(functions: Functions) {
        for(var identifier in functions){
            this.functions[identifier] = functions[identifier];
        }
    }
}

export class Expression{
    raw:    string;
    source: Json.JString; //null source means the compiler generated it

    static FALSE: Expression = new Expression("false", null);
    static TRUE: Expression = new Expression("true", null);

    constructor (raw: string, source: Json.JString) {
        this.raw = raw;
        this.source = source;
    }
    static parse(raw: string): Expression{
        return new Expression(raw, null);
    }

    static parseUser(json: Json.JString): Expression{
        return new Expression(optimizer.sanitizeQuotes(json.value), json);
    }

    /**
     * changes next and prev references for next.parent() and prev.parent()
     */
    rewriteForChild(): string {
        var falafel_visitor = function(node) {
            if(node.type == "Identifier"){
                if(node.name == "next"){
                    node.update("next.parent()");
                }else if(node.name == "prev"){
                    node.update("prev.parent()");
                }
            }
        };

        return falafel(this.raw, {}, falafel_visitor).toString();
    }

    /**
     * changes next and prev references for next['child_name'] and prev['child_name']
     * wildchild's can't be represented in their parents context, so wildchilds are conservatively
     * represented as "false"
     */
    rewriteForParent(child_name): string{
        if(child_name.indexOf("$") == 0)  return "false"; //wildchilds can't be pushed up
        if(child_name.indexOf("~$") == 0) return "true";  //wilderchilds can be pushed up

        var falafel_visitor = function(node){
            if(node.type == "Identifier"){
                if(node.name == "next"){
                    node.update("next['" + child_name +"']");
                }else if(node.name == "prev"){
                    node.update("prev['" + child_name +"']");
                }
            }
        };

        return <string>falafel(this.raw, {}, falafel_visitor).toString();
    }

    expandFunctions(symbols: Symbols): string {
        var self: Expression = this;
        var falafel_visitor = function(node){

            //console.log("type:", node.type);

            if(node.type == "Identifier"){
                if(symbols.functions[node.name]){
                    node.expr_type = "pred"
                }else if(symbols.variables[node.name]){
                    node.update(symbols.variables[node.name].source());
                    node.expr_type = symbols.variables[node.name].expr_type
                }
            } else if(node.type == "CallExpression"){
                if(node.callee.expr_type === "pred"){
                    //console.log(node)
                    //we are calling a user defined function
                    var fun: Function = symbols.functions[node.callee.name];

                    //clone the global symbol table and populate with binding to parameters
                    var function_symbols = symbols.clone();

                    var params = node.arguments;
                    for(var p_index in params){
                        var p_node = params[p_index];
                        var local_name = fun.parameter_map[p_index];
                        function_symbols.variables[local_name] = p_node;
                    }

                    var expansion = fun.expression.expandFunctions(function_symbols);

                    node.update("(" + expansion + ")");
                    node.expr_type = "value";
                }
            }
        };

        var code: string = falafel(this.raw, {}, falafel_visitor).toString();

        return optimizer.simplify(code);
    }

    generate(symbols: Symbols): string {
        var self: Expression = this;

        //the falafel visitor function replaces source with a different construction
        var falafel_visitor = function(node){

            //console.log("type:", node.type);

            if(node.type == "Identifier"){
                //console.log("identifier: ", node.name);

                if(node.name == "data"){
                    node.expr_type = "rule"
                }else if(node.name == "newData"){
                    node.expr_type = "rule"
                }else if(node.name == "next"){
                    node.update("newData");
                    node.expr_type = "rule"
                }else if(node.name == "prev"){
                    node.update("data");
                    node.expr_type = "rule"
                }else if(node.name == "root"){
                    node.expr_type = "rule"
                }else if(node.name.indexOf("$")==0){
                    node.expr_type = "value"
                }else if(node.name == "auth"){
                    node.expr_type = "map"
                }else if(symbols.functions[node.name]){
                    node.expr_type = "pred"
                }else if(symbols.variables[node.name]){
                    var label = node.name;
                    node.update(symbols.variables[node.name].source());
                    node.expr_type = symbols.variables[node.name].expr_type
                    node.label = label;
                }

            }else if(node.type == "Literal"){
                //console.log("literal: ", node.value);
                if ((typeof node.value == 'string' || node.value instanceof String) && node.raw.indexOf('/') == 0){
                    node.expr_type = "regex";
                } else {
                    node.expr_type = "value";
                }
            }else if(node.type == "ArrayExpression"){
                //console.log("ArrayExpression", node);
                node.expr_type = "value";

            }else if(node.type == "MemberExpression"){
                //console.log("MemberExpression:", node);

                //if the object is a type (rules, map or value) it unlocks different valid properties

                if(node.object.expr_type == "rule"){
                    node.expr_type = null;

                    if(node.property.type == 'Identifier'){
                        //reserved methods
                        if(node.property.name == 'val'){
                            node.expr_type = "fun():value"

                        }else if(node.property.name == 'parent'){
                            node.expr_type = "fun():rule"

                        }else if(node.property.name == 'hasChildren'){
                            node.expr_type = "fun(array):value"

                        }else if(node.property.name == 'hasChild'){
                            node.expr_type = "fun():value"

                        }else if(node.property.name == 'isString'){
                            node.expr_type = "fun():value"

                        }else if(node.property.name == 'isBoolean'){
                            node.expr_type = "fun():value"

                        }else if(node.property.name == 'isNumber'){
                            node.expr_type = "fun():value"

                        }else if(node.property.name == 'exists'){
                            node.expr_type = "fun():value"

                        }else if(node.property.name == 'now'){
                            node.expr_type = "value"

                        }else if(node.property.name == 'getPriority'){
                            node.expr_type = "fun():value"

                        }else if(node.property.expr_type == 'rule'){ //not a recognised
                            //cooertion from rule to value
                            node.update(node.object.source() + ".child(" + node.property.source() + ".val())");
                            node.expr_type = "rule"

                        }else if(node.property.expr_type == 'value'){
                            //not recognised member, so it must be an implicit child relation (without quotes in child)
                            if (node.property.label && !isArraySyntaxMemberExpression(node)) {
                                //data.a should stay as property.a, we don't want to use variable substitution in the property
                                //so we use the orginal label
                                node.update(node.object.source() + ".child('" + node.property.label + "')");
                            } else {
                                //data[a] should stay as property.a, we don;t want to use variable substitution in the property
                                //so we use the orginal label
                                node.update(node.object.source() + ".child(" + node.property.source() + ")");
                            }
                            node.expr_type = "rule"

                        }else{
                            //not recognised member, so it must be an implicit child relation (with quotes in child)
                            node.update(node.object.source() + ".child('" + node.property.source() + "')");
                            node.expr_type = "rule"
                        }
                    }else if(node.property.expr_type == 'rule'){ //not a recognised
                        //cooertion from rule to value
                        node.update(node.object.source() + ".child(" + node.property.source() + ".val())");
                        node.expr_type = "rule"
                    }else if(node.property.expr_type == 'value'){
                        //not recognised member, so it must be an implicit child relation (without quotes in child)
                        node.update(node.object.source() + ".child(" + node.property.source() + ")");
                        node.expr_type = "rule"
                    }
                }else if(node.object.expr_type == "map"){//auth is a map, auth.* always goes to a value
                    node.expr_type = "value"
                }else if(node.object.expr_type == "value"){
                    //inbuild methods for values
                    node.expr_type = "value";

                    //inbuilt methods for value objects
                    if(node.property.type == 'Identifier'){
                        if(node.property.name == 'contains'){
                            node.expr_type = "fun(value):value"
                        }else if(node.property.name == 'replace'){
                            node.expr_type = "fun(value,value):value"
                        }else if(node.property.name == 'toLowerCase'){
                            node.expr_type = "fun():value"
                        }else if(node.property.name == 'toUpperCase'){
                            node.expr_type = "fun():value"
                        }else if(node.property.name == 'beginsWith'){
                            node.expr_type = "fun():value"
                        }else if(node.property.name == 'endsWith'){
                            node.expr_type = "fun():value"
                        }else if(node.property.name == 'matches'){
                            node.expr_type = "fun(regex):value"
                        }
                    }
                }
                if(node.expr_type == null){
                    throw error.message("Bug: 3 Unexpected situation in type system " + node.object.expr_type + " " + node.property.expr_type).source(self.source).on(new Error());
                }
            }else if(node.type == "CallExpression"){
                if(node.callee.expr_type === "fun():rule"){
                    node.expr_type = "rule";
                }else if(node.callee.expr_type === "fun():value"){
                    node.expr_type = "value";
                }else if(node.callee.expr_type === "fun(array):rule"){
                    node.expr_type = "value";
                }else if(node.callee.expr_type === "fun(value):value"){
                    node.expr_type = "value";
                }else if(node.callee.expr_type === "fun(array):value"){
                    node.expr_type = "value";
                }else if(node.callee.expr_type === "fun(regex):value"){
                    node.expr_type = "value";
                }else if(node.callee.expr_type === "fun(value,value):value"){
                    node.expr_type = "value";
                }else if(node.callee.expr_type === "pred"){
                    //console.log(node)
                    //we are calling a user defined function
                    var fun: Function = symbols.functions[node.callee.name];

                    //clone the global symbol table and populate with binding to parameters
                    var function_symbols = symbols.clone();

                    var params = node.arguments;
                    for(var p_index in params){
                        var p_node = params[p_index];
                        var local_name = fun.parameter_map[p_index];
                        function_symbols.variables[local_name] = p_node;
                    }

                    var expansion = fun.expression.generate(function_symbols);

                    node.update("(" + expansion + ")");
                    node.expr_type = "value";
                }else{
                    if (node.callee.type == 'MemberExpression' && node.callee.property.type == 'Identifier' && node.callee.property.name == 'child') {
                        throw error.message("parent.child(<name>) syntax is not supported in Blaze, use parent.<name> or parent[<name>] instead").source(self.source).on(new Error());
                    } else {

                        var uncoerced = [
                            'contains',
                            'toLowerCase',
                            'replace',
                            'toUpperCase',
                            'beginsWith',
                            'endsWith',
                            'matches'
                        ];
                        if (node.callee.property != null && uncoerced.indexOf(node.callee.property.name) >=0 ) {
                            throw error.message("Unexpected situation in type system on '" + node.source() + "', (you probably forgot to use .val() before using an inbuilt method)").source(self.source).on(new Error());
                        } else {
                            throw error.message("Bug: 4 Unexpected situation in type system on '" + node.callee.expr_type + "'").source(self.source).on(new Error());
                        }

                    }
                }
            }else if(node.type == "BinaryExpression" || node.type == "BooleanExpression" || node.type == "LogicalExpression"){
                //coersion to value, if a rule (i.e. appending .val() when in a binary operator as ruleSnapshots don't support any binary operators)
                if(node.left.expr_type === "rule"){
                    node.left.update(node.left.source() + ".val()");
                }

                if(node.right.expr_type === "rule"){
                    node.right.update(node.right.source() + ".val()");
                }

                node.expr_type = "value"

            }else if(node.type == "UnaryExpression"){
                node.expr_type = node.argument.expr_type;
            }else if(node.type == "ExpressionStatement"){
            }else if(node.type == "Program"){
            }else{
                throw error.message("Bug: 5 Unrecognised Type In Expression Parser: " + node.type).source(self.source).on(new Error());
            }
        };

        var code: string = falafel(this.raw, {}, falafel_visitor).toString();

        return globals.optimize ? optimizer.optimizeAndTrim(code): optimizer.simplify(code);
    }
}

/**
 * figures out whether this is data.a or data[a] syntax
 * @param node
 */
function isArraySyntaxMemberExpression (node): boolean {
    return node.source().slice(node.object.source().length).trim().charAt(0) == '[';
}