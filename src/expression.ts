/// <reference path="../types/node.d.ts" />

var falafel = require("falafel");



export class SymbolTable{
    /*
    symbols: {[index:string]: Symbol};

    constructor(){
        this.symbols = {};
    }

    register(identifier:string, symbol:Symbol){
        this.symbols[identifier] = symbol
    }

    lookup(identifier:string):Symbol{
        return this.symbols[identifier]
    }*/
}



export class Expression{
    raw:         string;

    static parse(raw:string):Expression{
        var expr:Expression = new Expression();
        expr.raw = raw;
        return expr;
    }

    generate(symbols:SymbolTable):string {
        var expression:string[] = [];

        //the falafel visitor function replaces source with a different construction
        var falafel_visitor = function(node){

            console.log("type:", node.type);

            if(node.type == "Identifier"){
                console.log("identifier: ", node.name);

                if(node.name == "next"){
                    node.update("newData");
                    node.expr_type = "rule"
                }else if(node.name == "prev"){
                    node.update("data");
                    node.expr_type = "rule"
                }else if(node.name == "root"){
                    node.expr_type = "rule"
                }else if(node.name == "auth"){
                    node.expr_type = "map"
                }

            }else if(node.type == "Literal"){
                console.log("literal: ", node.value);

                node.expr_type = "value";
            }else if(node.type == "ArrayExpression"){
                node.expr_type = "value";

                //node.state = new C_VAL(node.value, mem);
            }else if(node.type == "MemberExpression"){
                //console.log("MemberExpression:", node);
                console.log("MemberExpression.object:", node.object);
                console.log("MemberExpression.property:", node.property);


                if(node.object.expr_type == "rule"){
                    node.expr_type = null;

                    if(node.property.type == 'Identifier'){
                        //reserved methods
                        if(node.property.name == 'val'){
                            node.expr_type = "fun():value"

                        }else if(node.property.name == 'parent'){
                            node.expr_type = "fun():rule"

                        }else if(node.property.name == 'hasChildren'){
                            node.expr_type = "fun(array):rule"

                        }else if(node.property.name == 'contains'){
                            node.expr_type = "fun(value):value"

                        }else{
                            //not recognised member, so it must be an implicit child relation (without quotes in child)
                            node.update(node.object.source() + ".child('" + node.property.source() + "')");
                            node.expr_type = "rule"
                        }
                    }else if(node.property.expr_type == 'value'){
                        //not recognised member, so it must be an implicit child relation (with quotes in child)
                        node.update(node.object.source() + ".child(" + node.property.source() + ")");
                        node.expr_type = "rule"
                    }
                }else if(node.object.expr_type == "map"){//auth is a map, auth.* always goes to a value
                    node.expr_type = "value"
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

            }else if(node.type == "ExpressionStatement"){
            }else if(node.type == "Program"){
            }else{
                console.log("error ", node.type);
                throw "Unrecognised Type";
            }
        };

        var code:string = falafel(this.raw, {}, falafel_visitor);

        return code;
    }
}