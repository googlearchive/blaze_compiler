/// <reference path="../types/tv4.d.ts" />
require('source-map-support').install();
import tv4  = require('tv4');
import Json = require('./json/jsonparser');
/**
 * Typescript can't subclass Error, so this is a syntax to decorate an Error thrown at the correct context
 * with more meaningful fields
 *
 * To use:-
 * var error = require("error");
 *
 * throw error.message("whoops").on(new Error());
 *
 */
export class Err{
    decorator: (error: Error) => Error;

    constructor (decorator: (error: Error) => Error){
        this.decorator = decorator
    }

    message(msg: string): Err {
        var parent = this;

        return new Err(function(error: Error){
            parent.on(error);
            error.message = msg;
            return error;
        });
    }

    validation(err: tv4.TV4Error): Err {
        var parent = this;

        return new Err(
            function(error: Error){ //we want to add properties to it so we take it out the type system, but really its type Error
                parent.on(error);
                (<any>error).validation_error = err;
                return error;
            });
    }

    source(source: Json.JValue): Err {
        var parent = this;

        return new Err(
            function(error: Error){ //we want to add properties to it so we take it out the type system, but really its type Error
                parent.on(error);
                (<any>error).source = source;
                return error;
            });
    }

    missingURI(uris: string[]): Err {
        var parent = this;

        return new Err(
            function(error: Error){
                parent.on(error);
                (<any>error).URI = uris;
                return error;
            });
    }

    on(error: Error): Error{
        return this.decorator(error);
    }
}

export function message(msg: string): Err {
    return err().message(msg);
}

export function source(src: Json.JValue): Err {
    return err().source(src);
}

export function validation(data: Json.JValue, schema: Json.JValue, data_name: string, schema_name: string, cause: tv4.TV4SingleResult): Err {
    var data_path: string   = (<any>cause).dataPath;
    var schema_path: string = (<any>cause).schemaPath;
    var validation_message: string = (<any>cause).message;


    console.log("data: ");
    console.log(data.toJSON());
    console.log("schema: ");
    console.log(schema.toJSON());
    console.log(cause);
    return err()
        .message([
            "cannot validate " + data_name  + " with " + schema_name,
            "cause was on location " + data_path,
            "does not validate schema rules at " + schema_path,
            validation_message,
        ].join("\n"))
        .validation(cause.error);
}
export function missingURI(cause: string[]): Err {
    return err().message("missing implementations of $ref").missingURI(cause);
}

export function err(): Err {
    return new Err(function(error: Error) {return error});
}

