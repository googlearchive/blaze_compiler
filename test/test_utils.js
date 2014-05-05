var firebase_io = require('../test/firebase_io.js');

function assert_admin_can_write(where, value, test, cb) {
    firebase_io.loginAs("anAdmin", true, function (err) {
        if (err) {
            test.ok(false, "can't login");
            cb("can't login");
        } else {
            firebase_io.sandbox.child(where).set(value, function (error) {
                test.ok(error == null, "there should not be an error but there was" + JSON.stringify({ function: "assert_admin_can_write", where: where, value: value }));
                cb(error);
            });
        }
    });
}
exports.assert_admin_can_write = assert_admin_can_write;

function assert_can_read(who, where, expected, test, cb) {
    firebase_io.loginAs(who, false, function (err) {
        if (err) {
            test.ok(false, "can't login");
            cb("can't login");
        } else {
            firebase_io.sandbox.child(where).once("value", function (data) {
                test.deepEqual(data.val(), expected);
                cb(null);
            }, function (error) {
                test.ok(error == null, "the once should be error free but isn't" + JSON.stringify({ function: "assert_can_read", who: who, where: where, expected: expected }));
                cb(error);
            });
        }
    });
}
exports.assert_can_read = assert_can_read;

function assert_cant_read(who, where, test, cb) {
    firebase_io.loginAs(who, false, function (err) {
        if (err) {
            test.ok(false, "can't login");
            cb("can't login");
        } else {
            firebase_io.sandbox.child(where).once("value", function (data) {
                test.ok(false, "should not be able to read");
                cb("should not be able to read");
            }, function (error) {
                if (error) {
                    cb(null);
                } else {
                    test.ok(false, "there should be a permission error but there isn't" + JSON.stringify({ function: "assert_cant_read", who: who, where: where }));
                    cb("there should be a permission error but there isn't");
                }
            });
        }
    });
}
exports.assert_cant_read = assert_cant_read;

function assert_can_write(who, where, value, test, cb) {
    firebase_io.loginAs(who, false, function (err) {
        if (err) {
            test.ok(false, "can't login");
            cb("can't login");
        } else {
            firebase_io.sandbox.child(where).set(value, function (error) {
                test.ok(error == null, "there should not be an error but there was" + JSON.stringify({ function: "assert_can_write", who: who, where: where, value: value }));
                if (error) {
                    cb("there should not be an error but there was");
                } else {
                    cb(null);
                }
            });
        }
    });
}
exports.assert_can_write = assert_can_write;

function assert_can_write_mock(who, where, value, test, cb) {
    firebase_io.simulateLoginAs(who, false, function (err) {
        if (err) {
            test.ok(false, "can't login");
            cb("can't login");
        } else {
            firebase_io.sandbox.child(where).set(value, function (error) {
                test.ok(error == null, "there should not be an error but there was" + JSON.stringify({ function: "assert_can_write_mock", who: who, where: where, value: value }));
                if (error) {
                    cb("there should not be an error but there was");
                } else {
                    cb(null);
                }
            });
        }
    });
}
exports.assert_can_write_mock = assert_can_write_mock;

function assert_cant_write(who, where, value, test, cb) {
    firebase_io.loginAs(who, false, function (err) {
        if (err) {
            test.ok(false, "can't login");
            cb("can't login");
        } else {
            firebase_io.sandbox.child(where).set(value, function (error) {
                test.ok(error != null, "there should be an error but there wasn't" + JSON.stringify({ function: "assert_cant_write", who: who, where: where, value: value }));
                if (error) {
                    cb(null);
                } else {
                    cb("there should be an error but there wasn't");
                }
            });
        }
    });
}
exports.assert_cant_write = assert_cant_write;
//# sourceMappingURL=test_utils.js.map
