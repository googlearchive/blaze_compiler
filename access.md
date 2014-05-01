# Access Control 

The new security semantics 2.0 seperate access control from data intergrity constraints. At some point these need to be combined. The data intergrity contrains must *always* be true, whilst only one ACL entry is needed to grant access to a portion of the tree. This document is about understanding how to expand these seperate definitions into a single set of write rules for implementation in the underlying existing security 1.0 notation.

## defs

root is the root of the firebase. chldN is the Nth child of root, grndN is the Nth grandchild of root

## 

```
schema:
root.chld1        write: auth=red
    .chld1.grnd1  write: auth=black|red
          .grnd2  write: true
    .chld2.grnd3  write: auth=black
          .grnd4  write: auth=red|black
          
```

first the schema model leaves are &&ed with their ancestors

```
leaf_only_schema:
root.chld1.grnd1  write: (auth=black|red) && (auth=red)
          .grnd2  write: (true) && (auth=red)
    .chld2.grnd3  write: auth=black
          .grnd4  write: auth=red|black
          
```

Given the ACL:

```
access:
  - location: root.chld1.*
    write: auth:red

  - location: *
    write: auth:black
```

then the ACL options (||ed) are &&ed to the relevant portions of the leaf schema tree

```
ACL & leaf_only_schema:
root.chld1.grnd1  write: (auth=black|red) && (auth=red) && (auth:red || auth:black)
          .grnd2  write: (true) && (auth=red)           && (auth:red || auth:black)
    .chld2.grnd3  write: (auth=black)                   && (auth:black)
          .grnd4  write: (auth=red|black)               && (auth:black)
```  

So if auth is red, root.chld1.\* is writable
So if auth is black, \* is not writable, but root.chldX.grnd(1|3|4) are
    

Note firebase 1.0 rules really only operate on leaves so we jsut have to carry the rules forward on the leaves.
