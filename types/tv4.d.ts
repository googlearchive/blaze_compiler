// Type definitions for Tiny Validator tv4 1.0.6
// Project: https://github.com/geraintluff/tv4
// Definitions by: Bart van der Schoor <https://github.com/Bartvds>
// Definitions: https://github.com/borisyankov/DefinitelyTyped


declare module "tv4" {
    export interface TV4ErrorCodes {
        [key:string]:number;
    }
    export interface TV4Error {
        code:number;
        message:string;
        dataPath:string;
        schemaPath:string;
    }
    export interface TV4SchemaMap {
        [uri:string]:any;
    }
    export interface TV4BaseResult {
        missing:string[];
        valid:boolean;
        dataPath: string;
        schemaPath: string;
    }
    export interface TV4SingleResult extends TV4BaseResult {
        error:TV4Error;
    }
    export interface TV4MultiResult extends TV4BaseResult {
        errors:TV4Error[];
    }

    export function validate(data:any, schema:any, checkRecursive:boolean, additionalProperties:boolean):boolean;
    export var error:TV4SingleResult;

    export function validateResult(data:any, schema:any):TV4SingleResult;
    export function validateMultiple(data:any, schema:any):TV4MultiResult;

    export function addSchema(uri:string, schema:any):boolean;
    export function getSchema(uri:string):any;
    export function normSchema(schema:any, baseUri:string):any;
    export function resolveUrl(base:string, href:string):string;
    export function freshApi():void;
    export function dropSchemas():void;
    export function reset():void;

    export function getMissingUris(exp?:RegExp):string[];
    export function getSchemaUris(exp?:RegExp):string[];
    export function getSchemaMap():TV4SchemaMap;
    export var errorCodes:TV4ErrorCodes;
}