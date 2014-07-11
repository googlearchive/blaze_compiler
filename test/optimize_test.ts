/// <reference path="../types/nodeunit.d.ts" />
/// <reference path="../src/expression.ts" />
import optimizer = require('../src/optimizer');

//var unoptimized:string = "true&&(true&&(true&&(!newData.child('chld1').child('grnd1').parent().parent().exists()||!(newData.child('chld1').child('grnd1').parent().parent().isString()||newData.child('chld1').child('grnd1').parent().parent().isNumber()||newData.child('chld1').child('grnd1').parent().parent().isBoolean()))&&(auth.username=='red'&&(!newData.child('chld1').child('grnd1').parent().exists()||!(newData.child('chld1').child('grnd1').parent().isString()||newData.child('chld1').child('grnd1').parent().isNumber()||newData.child('chld1').child('grnd1').parent().isBoolean())))&&((auth.username=='red'||auth.username=='black')&&(!newData.child('chld1').child('grnd1').exists()||newData.child('chld1').child('grnd1').isString())))&&(true&&(!newData.child('chld1').child('grnd2').parent().parent().exists()||!(newData.child('chld1').child('grnd2').parent().parent().isString()||newData.child('chld1').child('grnd2').parent().parent().isNumber()||newData.child('chld1').child('grnd2').parent().parent().isBoolean()))&&(auth.username=='red'&&(!newData.child('chld1').child('grnd2').parent().exists()||!(newData.child('chld1').child('grnd2').parent().isString()||newData.child('chld1').child('grnd2').parent().isNumber()||newData.child('chld1').child('grnd2').parent().isBoolean())))&&(true&&(!newData.child('chld1').child('grnd2').exists()||newData.child('chld1').child('grnd2').isString()))))&&(true&&(true&&(!newData.child('chld2').child('grnd3').parent().parent().exists()||!(newData.child('chld2').child('grnd3').parent().parent().isString()||newData.child('chld2').child('grnd3').parent().parent().isNumber()||newData.child('chld2').child('grnd3').parent().parent().isBoolean()))&&(true&&(!newData.child('chld2').child('grnd3').parent().exists()||!(newData.child('chld2').child('grnd3').parent().isString()||newData.child('chld2').child('grnd3').parent().isNumber()||newData.child('chld2').child('grnd3').parent().isBoolean())))&&(auth.username=='black'&&(!newData.child('chld2').child('grnd3').exists()||newData.child('chld2').child('grnd3').isString())))&&(true&&(!newData.child('chld2').child('grnd4').parent().parent().exists()||!(newData.child('chld2').child('grnd4').parent().parent().isString()||newData.child('chld2').child('grnd4').parent().parent().isNumber()||newData.child('chld2').child('grnd4').parent().parent().isBoolean()))&&(true&&(!newData.child('chld2').child('grnd4').parent().exists()||!(newData.child('chld2').child('grnd4').parent().isString()||newData.child('chld2').child('grnd4').parent().isNumber()||newData.child('chld2').child('grnd4').parent().isBoolean())))&&((auth.username=='red'||auth.username=='black')&&(!newData.child('chld2').child('grnd4').exists()||newData.child('chld2').child('grnd4').isString()))))&&(false||auth.username=='black')";

export function testSimplify1(test:nodeunit.Test):void{
    var unoptimized:string = "true && (false && (true && false) && (true && false) && true)";
    var optimized = optimizer.simplify(unoptimized);
    console.log(optimized);
    //it be nice if this expanded to just && but because of lazy evaluation is not actually equivalent in general
    test.notEqual(unoptimized, optimized);
    test.ok(optimized.length < unoptimized.length, "no improvement");
    test.done();
}

export function testSimplify2(test:nodeunit.Test):void{
    var unoptimized:string = "5 / (7 * 6)";
    var optimized = optimizer.simplify(unoptimized);
    test.equal(optimized, "5/(7*6)");
    test.done();
}

export function testSimplify3(test:nodeunit.Test):void{
    var unoptimized:string = "(5 / 6) * 7";
    var optimized = optimizer.simplify(unoptimized);
    test.equal(optimized, "5/6*7");
    test.done();
}
