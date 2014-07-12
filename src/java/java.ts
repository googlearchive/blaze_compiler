require('source-map-support').install();
import schema = require('../schema');
import rules = require('../blaze');
import expression = require('../expression');
import fs = require('fs');
var TARGET: string = "model.java";
var DEBUG: boolean;

/**
 * from a compiled model of the rules, a typed java source file is created
 */
export function generate(model: rules.Rules, debug: boolean) {
    console.log("generating", TARGET);
    DEBUG = debug;

    //big array we put all the output in
    var lines: string[] = [];

    generate_class(model.schema.root, lines);

    fs.writeFile(TARGET, lines.join("\n"));

}


function generate_class(schema: schema.SchemaNode, output: string[]) {
    if (DEBUG) console.log("generate_class", schema);

    //big array we put all the output in
    var lines: string[] = [];



}