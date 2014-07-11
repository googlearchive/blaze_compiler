/**
 * A number of utilities to test read and write permissions for the sandbox firebase
 * These take a nodeunit test as a parameter, and assert a number of things that should work
 * They DO modify the firebase's data, so you can use their side effects to write specific data into the firebase and it
 * double checks the the transaction as it progresses
 *
 * A second utility is for the tests to checkpoint the firebase, so that it can be rolled back to previous states
 *
 * All functions return deferred objects as many of the methods are async
 *
 * read permissions also want the expected value in the read location.
 */
/// <reference path="../types/node.d.ts" />
/// <reference path="../types/async.d.ts" />
/// <reference path="../types/nodeunit.d.ts" />
var firebase_io = require('../test/firebase_io.js');

/**
 * This tests that admin can write independent of read/write rules by writing to a specific location (can be /)
 * @param where the firebase path e.g. "/" for writing the whole firebase
 * @param value the value to put in the firebase e.g. {users:{tom:{..}, ...}}
 * @param test the nodeunit to check invariants
 * @return {*} Deferred object
 */
export function assert_admin_can_write(where:string, value:any, test:nodeunit.Test, cb){
    firebase_io.loginAs("anAdmin", true, function(err){
        if(err){
            test.ok(false, "can't login");
            cb("can't login")
        }else{
            firebase_io.sandbox.child(where).set(value, function(error){
                test.ok(error==null, "there should not be an error but there was" +
                    JSON.stringify({function:"assert_admin_can_write", where:where, value:value}));
                cb(error);
            });
        }
    });
}


export function assert_can_read(who:string, where:string, expected:any, test:nodeunit.Test, cb){
    firebase_io.loginAs(who, false, function(err){
        if(err){
            test.ok(false, "can't login");
            cb("can't login")
        }else{
            firebase_io.sandbox.child(where).once("value", function(data){
                test.deepEqual(data.val(), expected);
                cb(null);
            }, function(error){
                test.ok(error==null, "the once should be error free but isn't" +
                    JSON.stringify({function:"assert_can_read", who:who, where:where, expected:expected}));
                cb(error);
            });
        }
    });
}

export function assert_cant_read(who:string, where:string, test:nodeunit.Test, cb){
    firebase_io.loginAs(who, false, function(err){
        if(err){
            test.ok(false, "can't login");
            cb("can't login")
        }else{
            firebase_io.sandbox.child(where).once("value", function(data){
                test.ok(false, "should not be able to read");
                cb("should not be able to read");
            }, function(error){
                if(error){
                    cb(null);
                }else{
                    test.ok(false, "there should be a permission error but there isn't" +
                    JSON.stringify({function:"assert_cant_read", who:who, where:where}));
                    cb("there should be a permission error but there isn't");
                }
            });
        }
    });
}

export function assert_can_write(who:string, where:string, value:any, test:nodeunit.Test, cb){
    firebase_io.loginAs(who, false, function(err){
        if(err){
            test.ok(false, "can't login");
            cb("can't login")
        }else{
            firebase_io.sandbox.child(where).set(value, function(error){
                test.ok(error==null, "there should not be an error but there was" +
                    JSON.stringify({function:"assert_can_write", who:who, where:where, value:value}));
                if(error){
                    cb("there should not be an error but there was");
                }else{
                    cb(null);
                }
            });
        }
    });
}

export function assert_can_write_mock(who:string, where:string, value:any, test:nodeunit.Test, cb){
    firebase_io.simulateLoginAs(who, false, function(err){
        if(err){
            test.ok(false, "can't login");
            cb("can't login")
        }else{
            firebase_io.sandbox.child(where).set(value, function(error){
                test.ok(error==null, "there should not be an error but there was" +
                    JSON.stringify({function:"assert_can_write_mock", who:who, where:where, value:value}));
                if(error){
                    cb("there should not be an error but there was");
                }else{
                    cb(null);
                }
            });
        }
    });
}

export function assert_cant_write(who:string, where:string, value:any, test:nodeunit.Test, cb){
    firebase_io.loginAs(who, false, function(err){
        if(err){
            test.ok(false, "can't login");
            cb("can't login")
        }else{
            firebase_io.sandbox.child(where).set(value, function(error){
                test.ok(error!=null,"there should be an error but there wasn't" +
                    JSON.stringify({function:"assert_cant_write", who:who, where:where, value:value}));
                if(error){
                    cb(null);
                }else{
                    cb("there should be an error but there wasn't");
                }
            });
        }
    });
}