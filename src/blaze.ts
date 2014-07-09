/// <reference path="../types/node.d.ts" />
/// <reference path="../types/optimist.d.ts" />

var optimist = require('optimist'); //something weird going on, can't import it properly
import compile = require('./compile');



var argv = optimist
  .usage('blaze <file>')
  .boolean('v')
  .describe('v', 'enable debug output')
  .argv;



var file = argv._[0];


if(file){
    console.log("transpiling", file);
    compile.compile(file, argv['v']);
}else{
    //todo use optimist for nicely printed instructions
    console.log("you must specify a YAML or JSON file, -v for verbose output");
}


