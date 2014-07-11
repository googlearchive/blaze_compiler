/// <reference path="../types/node.d.ts" />

var falafel = require("falafel");

var XRegExp = require('xregexp').XRegExp;


import optimizer = require('../src/optimizer');

//todo
//implement explicit types rather than ad hoc string

export class Predicate{
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

    constructor(declaration:string, expression:string) {
        //break the function declaration into its parts
        var match = XRegExp.exec(declaration, Predicate.DECLARATION_FORMAT);
        var params = XRegExp.split(match.paramlist, /\s*,\s*/);

        //bug fix for weird split behaviour (preserved in XRegExp)
        //if the declaration has no parameters, the "paramlist" gets split as [''] for some reason
        if(params.length==1 && params[0] == '') params = []; //convert it to empty list as it should be

        this.identifier = match.name;
        this.signature = match.name + "(" + params.length + ")";

        //now build up positional information of params
        this.parameter_map = params;

        this.expression = Expression.parse(expression);
    }

    static parse(json:any):Predicate{
        //console.log("Predicate.parse:", json);

        for(var key in json){//there should only be one entry
            var predicate = new Predicate(key, json[key]);

        }
        return predicate
    }
}

/**
 * instances support indexing like arrays, which maps cannocal predicate declarations to Predicate definitions
 */
export class Predicates{
    [index: string]: Predicate;

    static parse(json:any):Predicates{
        //console.log("Predicates.parse:", json);
        var predicates = new Predicates();

        for(var predicate_def in json){
            var predicate:Predicate = Predicate.parse(json[predicate_def]);
            predicates[predicate.identifier] = predicate;
        }
        return predicates
    }
}

export class Symbols{
    predicates: {[index: string]: Predicate} = {};
    variables:  {[index: string]: any}    = {}; //string->AST node

    clone():Symbols{
        var clone:Symbols =  new Symbols()
        for(var p in this.predicates)clone.predicates[p] = this.predicates[p];
        for(var v in this.variables) clone.variables[v] = this.variables[v];
        return clone;
    }

    loadPredicate(predicates:Predicates){
        for(var identifier in predicates){
            this.predicates[identifier] = predicates[identifier];
        }
    }
}

export class Expression{
    raw:         string;

    static parse(raw:string):Expression{
        var expr:Expression = new Expression();
        expr.raw = raw;
        return expr;
    }

    /**
     * changes next and prev references for next.parent() and prev.parent()
     */
    rewriteForChild():string{
        var falafel_visitor = function(node){
            if(node.type == "Identifier"){
                if(node.name == "next"){
                    node.update("next.parent()");
                }else if(node.name == "prev"){
                    node.update("prev.parent()");
                }
            }
        };

        return <string>falafel(this.raw, {}, falafel_visitor);
    }

    /**
     * changes next and prev references for next['child_name'] and prev['child_name']
     * wildchild's can't be represented in their parents context, so wildchilds are conservatively
     * represented as "false"
     */
    rewriteForParent(child_name):string{
        if(child_name.indexOf("$") == 0) return "false"; //wildchilds can't be pushed up

        var falafel_visitor = function(node){
            if(node.type == "Identifier"){
                if(node.name == "next"){
                    node.update("next['" + child_name +"']");
                }else if(node.name == "prev"){
                    node.update("prev['" + child_name +"']");
                }
            }
        };

        return <string>falafel(this.raw, {}, falafel_visitor);
    }

    generate(symbols:Symbols):string {
        //the falafel visitor function replaces source with a different construction
        var falafel_visitor = function(node){

            //console.log("type:", node.type);

            if(node.type == "Identifier"){
                //console.log("identifier: ", node.name);

                if(node.name == "next"){
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
                }else if(symbols.predicates[node.name]){
                    node.expr_type = "pred"
                }else if(symbols.variables[node.name]){
                    node.update(symbols.variables[node.name].source());
                    node.expr_type = symbols.variables[node.name].expr_type
                }

            }else if(node.type == "Literal"){
                //console.log("literal: ", node.value);

                node.expr_type = "value";
            }else if(node.type == "ArrayExpression"){
                //console.log("ArrayExpression", node);
                node.expr_type = "value";

                //node.state = new C_VAL(node.value, mem);
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
                            node.update(node.object.source() + ".child(" + node.property.source() + ")");
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
                    node.expr_type = "value"

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
                        }
                    }
                }

                if(node.expr_type == null){
                    console.error(node);
                    throw Error("unexpected situation in type system " + node.object.expr_type + " " + node.property.expr_type)
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
                }else if(node.callee.expr_type === "fun(value,value):value"){
                    node.expr_type = "value";
                }else if(node.callee.expr_type === "pred"){
                    //console.log(node)
                    //we are calling a user defined predicate
                    var predicate:Predicate = symbols.predicates[node.callee.name];

                    //clone the global symbol table and populate with binding to parameters
                    var predicate_symbols = symbols.clone();

                    var params = node.arguments;
                    for(var p_index in params){
                        var p_node = params[p_index];
                        var local_name = predicate.parameter_map[p_index];
                        predicate_symbols.variables[local_name] = p_node;
                    }

                    var expansion = predicate.expression.generate(predicate_symbols);

                    node.update("(" + expansion + ")");
                    node.expr_type = "value";
                }else{
                    console.error(node);
                    throw Error("unexpected situation in call expression " + node.callee.expr_type)
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
                console.log("error ", node.type);
                throw "Unrecognised Type";
            }
        };

        var code:string = falafel(this.raw, {}, falafel_visitor).toString();

        return optimizer.simplify(code);
    }
}