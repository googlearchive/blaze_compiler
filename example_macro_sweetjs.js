//npm install -g sweet.js
//sjs -o example_out.js example.js

var js_yaml = require("js-yaml");
//require("firebase-macros");

//https://github.com/mozilla/sweet.js/issues/178
//we get backtick multi line string in ECMAscript 6, use a macro for now
//https://gist.github.com/tuchida/9166234 uses comments instead of backticks for multilines, might play better with IDEs if you can get it working
let STR = macro {
    case {_ $template } => {
        var temp = #{$template}[0];
        var tempString = temp.token.value.raw;
        letstx $newTemp = [makeValue(tempString, #{here})];
        return #{$newTemp}
    }
}

exports.schema = js_yaml.load( //you could also define the schema using JSON instead of YAML
STR `
  name: hello
  type: object
  properties:
    name: cool
`);

console.log("the YAML schema after converting to JSON is:");
console.log(exports.schema);

exports.roles = { //could do this in YAML too
    isLoggedIn: "auth !== null", //todo check
    isUser:     "auth.id == $user && roles.isLoggedIn", //roles should be hierarchical, but is this the best way to lookup functions? references need to be wrapped in "(" ")"
    isManager:  "root['roles']['managers'][auth.id].exists()" //array syntax instead of loads of 'child'
};


exports.access = access_control()
    .rw( 'users/$user/**', roles.isUser)               //how will access control actually find the isLoggedIn definition? (roles are exported?)
    .r( '/users/$user/*',  roles.isManager)
    .rw('**',              "auth.username == 'tom'")   //is this obvious that it overrides everything, is there another interpretation?
;


