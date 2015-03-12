require('source-map-support').install();
import schema = require('../schema');
import rules = require('../blaze');
import expression = require('../expression');
import fs = require('fs');
var TARGET: string = "model.java";
var DEBUG: boolean;

var TARGET_FIREBASE_URL: string = "https://firesafe-sandbox.firebaseio.com";

/**
 * from a compiled model of the rules, a typed java source file is created
 */
export function generate(model: rules.Rules, debug: boolean) {
    console.log("generating", TARGET);
    DEBUG = true; //debug;

    //big array we put all the output in
    var lines: string[] = [];

    generate_class("root", model.schema.root, 0, lines);

    fs.writeFile(TARGET, lines.join("\n"));

}

function writeLine(value: string, depth: number, output: string[]) {
    var prefix = Array(depth * 2).join(" ");
    var line = prefix + value;
    if (DEBUG) console.log(line);
    output.push(line);
}

function seperator(output: string[]) {
    if (DEBUG) console.log("");
    output.push("");
}

function generate_class(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    writeLine("public static class " + name + " {", depth, output);
    seperator(output);


    generate_ref(name, schema, depth + 1, output);

    var wildchild_key = null;

    for (var child in schema.properties) {
        if (child.indexOf("$") == 0 || child.indexOf("~$") == 0) {
            wildchild_key = child;
        } else {
            generate_class(child, schema.properties[child], depth + 1, output);
        }
    }

    if (wildchild_key != null) {
        generate_wildchild_class(wildchild_key, schema.properties[child], depth + 1, output);
    }

    writeLine("}", depth, output);
}

function generate_wildchild_class(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    writeLine("public static class " + name + " {", depth, output);
    seperator(output);


    generate_ref(name, schema, depth + 1, output);

    var wildchild_key = null;

    for (var child in schema.properties) {
        if (child.indexOf("$") == 0 || child.indexOf("~$") == 0) {
            wildchild_key = child;
        } else {
            generate_class(child, schema.properties[child], depth + 1, output);
        }
    }

    if (wildchild_key != null) {
        generate_wildchild_class(wildchild_key, schema.properties[child], depth + 1, output);
    }

    writeLine("}", depth, output);
}


function generate_ref(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    generate_ref_class(name, schema, depth, output);
}
function generate_ref_class(name: string, schema: schema.SchemaNode, depth: number, output: string[]) {
    writeLine("public static class Ref {", depth, output);
    writeLine("  Firebase ref;", depth, output);


    var params_dec = "String $messageid";
    var path = "yo";

    writeLine("  private Ref(" + params_dec + ") {", depth, output);

    writeLine("     this.ref = new Firebase(\"" + path + "\")", depth, output);
    writeLine("  }", depth, output);
    writeLine("}", depth, output);
}