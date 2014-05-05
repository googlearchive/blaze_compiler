exports.Firebase = require('firebase');
exports.sandbox = new exports.Firebase(require('../properties.js').FIREBASE_LOCATION);
exports.FIREBASE_SECRET = require('../properties.js').FIREBASE_SECRET;
exports.FIREBASE_LOCATION = require('../properties.js').FIREBASE_LOCATION;

function setValidationRules(rules_str, cb) {
    var https = require('https');

    var options = {
        hostname: exports.FIREBASE_LOCATION,
        port: 443,
        path: '/.settings/rules.json?auth=' + exports.FIREBASE_SECRET,
        method: 'PUT'
    };

    var req = https.request(options, function (res) {
        res.on('data', function (d) {
            process.stdout.write(d);
            var data = JSON.parse(d);
            if (data.status == "ok") {
                cb(null);
            } else {
                cb(data.status);
            }
        });
    });

    req.write(rules_str, 'utf8');
    req.end();

    req.on('error', function (e) {
        console.error(e);
        cb(e, null);
    });
}
exports.setValidationRules = setValidationRules;

function getValidationRules(rules_str, cb) {
    console.log("\n getValidationRules");

    var https = require('https');

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
        console.error(e);
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

function loginAs(username, admin, cb) {
    exports.login(exports.getAuthToken(username, admin), cb);
}
exports.loginAs = loginAs;

function simulateLoginAs(username, admin, cb) {
    exports.login(exports.getAuthToken(username, admin, true), cb);
}
exports.simulateLoginAs = simulateLoginAs;
//# sourceMappingURL=firebase_io.js.map
