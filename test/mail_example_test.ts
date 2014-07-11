/// <reference path="../types/nodeunit.d.ts" />
import expressions = require('../src/expression');

import test_utils  = require('./test_utils');
import firebase_io = require('./firebase_io');
import compiler = require('../src/compiler');
import rules = require('../src/blaze');
import async = require('async');

export function testSetup(test:nodeunit.Test):void{
    async.series([
        firebase_io.setValidationRules.bind(null, compiler.compile("examples/mail_example.yaml", true).code)
    ], test.done.bind(null));
}

export function testWriteInbox(test:nodeunit.Test):void{
    async.series([
        test_utils.assert_admin_can_write.bind(null, "/", {}, test),

        //check from field must be correct
        test_utils.assert_cant_write.bind(null,  "tom", "/users/bill/inbox/1", {
            from: "george",
            to:   "bill",
            message: "Hi Bill!"
        }, test),

        //check spurious fields can't be added
        test_utils.assert_cant_write.bind(null,  "tom", "/users/bill/inbox/1", {
            from: "tom",
            to:   "bill",
            message: "Hi Bill!",
            spurious: "spurious data"
        }, test),

        //correct write:-
        test_utils.assert_can_write.bind(null,  "tom", "/users/bill/inbox/1", {
            from: "tom",
            to:   "bill",
            message: "Hi Bill!"
        }, test),

        //check even the sender cannot delete a sent mail
        test_utils.assert_cant_write.bind(null,  "tom", "/users/bill/inbox/1", {}, test),

        //check the inbox owner cannot tamper with message fields
        test_utils.assert_cant_write.bind(null,  "bill", "/users/bill/inbox/1/message", "bill gets my inheritance", test),
        test_utils.assert_cant_write.bind(null,  "bill", "/users/bill/inbox/1/from",    "bill", test)

    ], test.done.bind(null));
}

export function testDeleteInbox(test:nodeunit.Test):void{
    async.series([
        test_utils.assert_admin_can_write.bind(null, "/", {}, test),

        test_utils.assert_can_write.bind(null,  "tom", "/users/bill/inbox/1", {
            from: "tom",
            to:   "bill",
            message: "Hi Bill!"
        }, test),

        //sender can't delete their sent mail
        test_utils.assert_cant_write.bind(null,  "tom", "/users/bill/inbox/1", {},  test),
        //receiver can delete their received mail
        test_utils.assert_can_write.bind (null,  "bill", "/users/bill/inbox/1", {}, test)

    ], test.done.bind(null));
}

export function testWriteOutbox(test:nodeunit.Test):void{
    async.series([
        test_utils.assert_admin_can_write.bind(null, "/", {}, test),

        //check from field must be correct
        test_utils.assert_cant_write.bind(null,  "bill", "/users/bill/outbox/1", {
            from: "joe",
            to:   "tom",
            message: "Hi Tom!"
        }, test),

        //check spurious fields can't be added
        test_utils.assert_cant_write.bind(null,  "bill", "/users/bill/outbox/1", {
            from: "bill",
            to:   "tom",
            message: "Hi Tom!",
            spurious: "spurious"
        }, test),

        //correct write:-
        test_utils.assert_can_write.bind(null,  "bill", "/users/bill/outbox/1", {
            from: "bill",
            to:   "tom",
            message: "Hi Tom!"
        }, test),

        //check even the receiver cannot delete a sent mail
        test_utils.assert_cant_write.bind(null,  "tom", "/users/bill/outbox/1", {}, test),

        //check the outbox owner cannot tamper with message fields
        test_utils.assert_cant_write.bind(null,  "bill", "/users/bill/outbox/1/message", "bill gets my inheritance", test),
        test_utils.assert_cant_write.bind(null,  "bill", "/users/bill/outbox/1/from",    "bill", test)

    ], test.done.bind(null));
}

export function testDeleteOutbox(test:nodeunit.Test):void{
    async.series([
        test_utils.assert_admin_can_write.bind(null, "/", {}, test),

        //correct write:-
        test_utils.assert_can_write.bind(null,  "bill", "/users/bill/outbox/1", {
            from: "bill",
            to:   "tom",
            message: "Hi Tom!"
        }, test),

        test_utils.assert_cant_write.bind(null, "tom",  "/users/bill/outbox/1",  {}, test),
        test_utils.assert_can_write.bind(null,  "bill", "/users/bill/outbox/1",  {}, test)

    ], test.done.bind(null));
}


export function testReadboxes(test:nodeunit.Test):void{
    async.series([
        test_utils.assert_admin_can_write.bind(null, "/", {}, test),

        //write some messages to bills boxes
        test_utils.assert_can_write.bind(null,  "bill", "/users/bill/outbox/1", {
            from: "bill",
            to:   "tom",
            message: "Hi Tom!"
        }, test),

        //correct write:-
        test_utils.assert_can_write.bind(null,  "tom", "/users/bill/inbox/1", {
            from: "tom",
            to:   "bill",
            message: "Hi Bill!"
        }, test),

        //check strangers can't read other people's mail
        test_utils.assert_cant_read.bind(null,  "tom", "/users/bill/outbox/1", test),
        test_utils.assert_cant_read.bind(null,  "tom", "/users/bill/inbox/1",  test),

        //check bill can read sent and received mail
        test_utils.assert_can_read.bind(null,  "bill", "/users/bill/outbox/1",  {
            from: "bill",
            to:   "tom",
            message: "Hi Tom!"
        }, test),

        test_utils.assert_can_read.bind(null,  "bill", "/users/bill/inbox/1",  {
            from: "tom",
            to:   "bill",
            message: "Hi Bill!"
        }, test)


    ], test.done.bind(null));
}