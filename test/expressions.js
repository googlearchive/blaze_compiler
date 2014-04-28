/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
var expressions = require('../src/expression');

function translationTestCase(from, to, predicates, test) {
    var expr = expressions.Expression.parse(from);

    var symbols = new expressions.Symbols();
    symbols.predicates = predicates;
    var translation = expr.generate(symbols);

    test.equal(translation, to);
}

function testArrayLookup1(test) {
    translationTestCase("next['c1'].val()", "newData.child('c1').val()", new expressions.Predicates(), test);
    test.done();
}
exports.testArrayLookup1 = testArrayLookup1;

function testArrayLookup2(test) {
    translationTestCase("next.c1.val()", "newData.child('c1').val()", new expressions.Predicates(), test);
    test.done();
}
exports.testArrayLookup2 = testArrayLookup2;

function testArrayLookup3(test) {
    translationTestCase("next[prev.val()].val()", "newData.child(data.val()).val()", new expressions.Predicates(), test);
    test.done();
}
exports.testArrayLookup3 = testArrayLookup3;

function testArrayLookup4(test) {
    translationTestCase("next[prev].val()", "newData.child(data.val()).val()", new expressions.Predicates(), test);
    test.done();
}
exports.testArrayLookup4 = testArrayLookup4;

function testArrayLookup5(test) {
    translationTestCase("next[prev.child].val()", "newData.child(data.child('child').val()).val()", new expressions.Predicates(), test);
    test.done();
}
exports.testArrayLookup5 = testArrayLookup5;

function testArrayLookup6(test) {
    translationTestCase("next[prev[child]].val()", "newData.child(data.child('child').val()).val()", new expressions.Predicates(), test);
    test.done();
}
exports.testArrayLookup6 = testArrayLookup6;

function testParent1(test) {
    translationTestCase("next.parent()", "newData.parent()", new expressions.Predicates(), test);
    test.done();
}
exports.testParent1 = testParent1;

function testParent2(test) {
    translationTestCase("next[prev.parent().val()]['blah'].c1.val()", "newData.child(data.parent().val()).child('blah').child('c1').val()", new expressions.Predicates(), test);
    test.done();
}
exports.testParent2 = testParent2;

function testHasChildren(test) {
    translationTestCase("next.c1.hasChildren(['eric'])", "newData.child('c1').hasChildren(['eric'])", new expressions.Predicates(), test);
    test.done();
}
exports.testHasChildren = testHasChildren;

function testContains1(test) {
    translationTestCase("next.c1.contains('yo')", "newData.child('c1').contains('yo')", new expressions.Predicates(), test);
    test.done();
}
exports.testContains1 = testContains1;

function testContains2(test) {
    translationTestCase("'yo'.contains('yo')", "'yo'.contains('yo')", new expressions.Predicates(), test);
    test.done();
}
exports.testContains2 = testContains2;

function testContains3(test) {
    translationTestCase("'yo'.contains(prev.val())", "'yo'.contains(data.val())", new expressions.Predicates(), test);
    test.done();
}
exports.testContains3 = testContains3;

function testAuth1(test) {
    translationTestCase("auth.id", "auth.id", new expressions.Predicates(), test);
    test.done();
}
exports.testAuth1 = testAuth1;

function testAuth2(test) {
    translationTestCase("root.users[auth.id]", "root.child('users').child(auth.id)", new expressions.Predicates(), test);
    test.done();
}
exports.testAuth2 = testAuth2;

function testCoercion1(test) {
    translationTestCase("root.superuser == auth.id", "root.child('superuser').val() == auth.id", new expressions.Predicates(), test);
    test.done();
}
exports.testCoercion1 = testCoercion1;

function testCoercion2(test) {
    translationTestCase("auth.id == root[next]", "auth.id == root.child(newData.val()).val()", new expressions.Predicates(), test);
    test.done();
}
exports.testCoercion2 = testCoercion2;

function test$var1(test) {
    translationTestCase("auth.id == $userid.val()", "auth.id == $userid.val()", new expressions.Predicates(), test);
    test.done();
}
exports.test$var1 = test$var1;

function test$var2(test) {
    translationTestCase("auth.id == $userid", "auth.id == $userid.val()", new expressions.Predicates(), test);
    test.done();
}
exports.test$var2 = test$var2;

function test$var3(test) {
    translationTestCase("prev[$userid].val()", "data.child($userid.val()).val()", new expressions.Predicates(), test);
    test.done();
}
exports.test$var3 = test$var3;

function test$var4(test) {
    //bit weird this works
    translationTestCase("prev.$userid.val()", "data.child($userid.val()).val()", new expressions.Predicates(), test);
    test.done();
}
exports.test$var4 = test$var4;

function testPredicate1(test) {
    //bit weird this works
    translationTestCase("isLoggedIn()", "(auth.id == null)", expressions.Predicates.parse([{ "isLoggedIn()": "auth.id == null" }]), test);
    test.done();
}
exports.testPredicate1 = testPredicate1;

function testPredicate2(test) {
    //bit weird this works
    translationTestCase("isEqual(prev, next.name)", "(data.val() == newData.child('name').val())", expressions.Predicates.parse([{ "isEqual(a, b)": "a == b" }]), test);
    test.done();
}
exports.testPredicate2 = testPredicate2;

function testPredicate3(test) {
    //bit weird this works
    translationTestCase("isLoggedIn(auth)", "(auth.id == 'yo')", expressions.Predicates.parse([{ "isLoggedIn(q)": "q.id == 'yo'" }]), test);
    test.done();
}
exports.testPredicate3 = testPredicate3;
//# sourceMappingURL=expressions.js.map
