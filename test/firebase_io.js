/**
* This module is for utility functions for Firebase
* For standard operations you can just use require("firebase") directly
*
* This is meant for more complex functions like uploading/downloading a validation/rule set
*/
exports.Firebase = require('firebase');
exports.sandbox = new exports.Firebase(require('../properties.js').FIREBASE_LOCATION);
exports.FIREBASE_SECRET = require('../properties.js').FIREBASE_SECRET;
exports.FIREBASE_LOCATION = require('../properties.js').FIREBASE_LOCATION;

/**
* uploads the validation rules (representated as a string)
* returns a deferred object, the error handler is called if the upload is rejected (e.g. invalid rules)
*/
function setValidationRules(rules_str, cb) {
    //console.log("\n setValidationRules: ", rules_str);
    //http://stackoverflow.com/questions/18840080/updating-firebase-security-rules-through-firebaseref-set
    var https = require('https');

    //equivelent of curl -X PUT -d '{ "rules": { ".read": true } }' https://SampleChat.firebaseio-demo.com/.settings/rules.json?auth=FIREBASE_SECRET
    var options = {
        hostname: exports.FIREBASE_LOCATION,
        port: 443,
        path: '/.settings/rules.json?auth=' + exports.FIREBASE_SECRET,
        method: 'PUT'
    };

    var req = https.request(options, function (res) {
        //console.log("statusCode: ", res.statusCode);
        //console.log("headers: ", res.headers);
        res.on('data', function (d) {
            process.stdout.write(d);
            var data = JSON.parse(d);
            if (data.status == "ok") {
                //so Firebase says it uploaded ok
                cb(null);
            } else {
                //went wrong
                cb(data.status);
            }
        });
    });

    req.write(rules_str, 'utf8'); //write the actual rules in the request payload
    req.end();

    req.on('error', function (e) {
        console.error(e); //the whole request went bad which is not a good
        cb(e, null);
    });
}
exports.setValidationRules = setValidationRules;

/**
* retreives the validation rules (representated as a string)
* returns a deferred object, with the rules being the data payload
*/
function getValidationRules(rules_str, cb) {
    console.log("\n getValidationRules");

    //http://stackoverflow.com/questions/18840080/updating-firebase-security-rules-through-firebaseref-set
    var https = require('https');

    //curl https://SampleChat.firebaseio-demo.com/.settings/rules.json?auth=FIREBASE_SECRET
    var options = {
        hostname: exports.FIREBASE_LOCATION,
        port: 443,
        path: '/.settings/rules.json?auth=' + exports.FIREBASE_SECRET,
        method: 'GET'
    };

    var req = https.request(options, function (res) {
        console.log("statusCode: ", res.statusCode);
        console.log("headers: ", res.headers);

        res.on('data', function (d) {
            var data = d.toString();
            console.log("\n", data);
            cb(null, data);
        });
    });

    req.end();

    req.on('error', function (e) {
        console.error(e); //the whole request went bad which is not a good
        cb(e, null);
    });
}
exports.getValidationRules = getValidationRules;

function getAuthToken(username, admin, simulate) {
    var FBTokenGenMod = require('firebase-token-generator');
    var FBTokenGenerator = new FBTokenGenMod(exports.FIREBASE_SECRET);
    return FBTokenGenerator.createToken({ username: username }, { admin: admin, simulate: simulate });
}
exports.getAuthToken = getAuthToken;

function login(AUTH_TOKEN, cb) {
    exports.sandbox.auth(AUTH_TOKEN, cb);
}
exports.login = login;

/**
* login to sandbox with the given username, and boolean option to be an admin
* @param username
* @param admin boolean, should the login be granted blanket read and write access??
* @return {*}
*/
function loginAs(username, admin, cb) {
    exports.login(exports.getAuthToken(username, admin), cb);
}
exports.loginAs = loginAs;

/**
* login to sandbox with the given username, and boolean option to be an admin
* @param username
* @param admin boolean, should the login be granted blanket read and write access??
* @return {*}
*/
function simulateLoginAs(username, admin, cb) {
    exports.login(exports.getAuthToken(username, admin, true), cb);
}
exports.simulateLoginAs = simulateLoginAs;
//# sourceMappingURL=firebase_io.js.map
