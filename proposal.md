# Security Rules 2.0 Proposal

The aim it to build a source-to-source compiler that reads a security rules 2.0 file and generates a security rules 1.0 file.
Probably this should be integrated with firebase-cli at some point, so tools for uploading the rules won't be developed.

## Security Compiler
- DONE YAML -> JSON via js-yaml
  - NO source maps at this stage
- DONE write a rule 2.0 JSON schema which describes what is a valid security 2.0 rule file.
    - schema section is approximately JSON schema
    - access, predicate table have highly structured layout so we need to catch syntax errors
- DONE transform a valid security rule 2.0 file into a valid security rule 1.0 file.
  - convert new style rule expressions into old style
  - build up internal representation of security tree (note schema and access control are declared far apart but effect local parts of the final representation)
  - export internal representation to a firebase security file 1.0

### Rule compiler

"write" and "read" rules have new semantics like predicate references, these need to be converted into the old notation. The rule compiler is language within a language dealing with:-

  - DONE predicate references
  - DONE data and newData changed to prev and next
  - DONE array syntax synonyms for .child(XXX)
  - DONE as its all valid JS it can be implemented using Esprima and related tools (falafel)

### Predicates

Section for declaring global predicates which need to be added to a symbol table and made accessible to the rule compiler
- DONE predicate key as a function declaration needs parsing to canonical (minimum white space) form, e.g. "isCool( $user )" is mapped to "isCool($user)"
- DONE instantiation of a predicate requires replacing the predicate body with the bound variables, so "isCool($fred)" expands to "users.child($fred).child(cool).val() === true" in a rule expression.
- DONE note predicate bodies will be turned into old style syntax later, so predicate bodies themselves need to be processed by the rule compiler.

### Access control

- DONE location e.g. "users/$userid/*"
- DONE "read" and "write" rules

delay for later
- overriding predicate symbol table

### Schema

JSON schema keywords to implement initially, through the meta-schema 
- DONE type: object, string
- DONE type: boolean, number
- DONE required
- DONE additionalProperties
- DONE definitions
- DONE properties
- DONE $ref
- DONE enum

JSON schema keywords to be ignored for now
- allOf, anyOf, oneOf, not (should be added soon though)
- type: array, null, integer
- id
- $schema
- title
- description
- default
- multipleOf
- maximum/exclusiveMaximum/minimum/exclusiveMinimum
- min/maxLength
- additionalItems, maxItems, minItems, uniqueItems //not possible?
- maxProperties minProperties //not possible?
- patternProperties
- dependencies

New Schema keywords developed for firebase
- DONE constraint to translation into security rules (should be expressed in 2.0 rule expression syntax)
- DONE $var handling
- DONE example/nonexample for inline testing

###Meta-schema

allow users and Firebase developers to implement custom keywords
- DONE meta-schema API
- DONE bottom up parsing, calling "preprocess", making the API available

### hyper schema
a preliminary hyper-schema should be implemented last, just to evaluate UI generation. The bare minimum to get json-editor working.

### Examples
- DONE a big example demonstrating all the features


