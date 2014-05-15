# Access Control

The new security semantics 2.0 seperate access control from data intergrity constraints. At some point these need to be combined. The data intergrity contrains must *always* be true, whilst only one ACL entry is needed to grant access to a portion of the tree. This document is about understanding how to expand these seperate definitions into a single set of write rules for implementation in the underlying existing security 1.0 notation.

## Conventions

root is the root of the firebase. chldN is the Nth child of root, grndN is the Nth grandchild of root

## One-to-One Parent-Child Relations

All constraints must be true over the entire tree for all write operations, therefore constraints expressed at any level of the heirarchy must be dispured over the entire tree. Access control may grant access at any layer.

consider:

```
schema:
root.chld1        write: auth=red
    .chld1.grnd1  write: auth=black|red
          .grnd2  write: true
    .chld2.grnd3  write: auth=black
          .grnd4  write: auth=red|black

```

first the schema model constraints are &&ed with their ancestors, top-down

```
leaf_only_schema:
root.chld1.grnd1  write: (auth=black|red) && (auth=red)
          .grnd2  write: (true) && (auth=red)
    .chld2.grnd3  write: auth=black
          .grnd4  write: auth=red|black

```

then we need to push the constraints back up the tree from the bottom-up, so that every point in the tree
contains the whole tree of constraints, and ancestors are stictly more restrictive
a parent is the && of its child constraints

```
ancestor schemas:
root       write: (((auth=black|red) && (auth=red))&&((true) && (auth=red))) && ((auth=black) && (auth=red|black))
root.chld1 write: ((auth=black|red) && (auth=red))&&((true) && (auth=red))
    .chld2 write: (auth=black) && (auth=red|black)


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

root.chld1 write: (((auth=black|red) && (auth=red))&&((true) && (auth=red))) && (auth:red || auth:black)
etc. for ancestors
```

So if auth is red, root.chld1.\* is writable and so should root.chld1 be writable without children
So if auth is black, \* is not writable, but root.chldX.grnd(3|4) are and so should root.chld2 be writable without children too

## evaluation context changes

expressions like "next.isString()" have to change their evaluation context when moved around the heirarchy. When constraints are pushed down to leaves it becomes "next.parent().isString()" in the childs evaluation context, or "next['childname'].isString()" in a parents context.


## One-to-Many Parent-Wildchild relations

These are impossible case for evaluation context changing. The ancestor *must* have stricter constraints than the children, as writing to an ancestor implies writing to the children. However, with wildchilds, there is no semantics for the parent to check all children meet their respective constraints.

consider a schema which is a list of string, and write access given to all the tree
```
schema:

root.$chld write: next.isString()

ACL:
-location: *
 write: true
```

A write to "/chld1" of "'a'" should obviously go through. But a write to "/" of "{chld1:"a", chld2:5}" should not, as chld2 is not of type string. However there is no security rule to express checking all the children when at the root level.

The critical observation is that the parent *must* be more restrictive, at least as restrictive as &&ing all the child constraints. Setting the parents write constraint to "false" meets the criteria of being at least as restrictive. Two more which may apply in some settings (not if next != prev):

- $chld = []
- forall(chld) next.$chld = prev.$chld

However only the false option is supported. So the compromise going forward is that we will propogate wildchild constraints up to ancestors as false. This ensures global consistency is maintained. The practical effect of this is that the use of wildcards locks writing further up, to prevent generous ACL entries allowing a user to write to wildchild locations ignoring their child constraints.

Note that children still inherit from parents though. So granting blanket root "/*" write access to an admin accout will allow the user to chop all leaves in the database off, eventuallly leading to an empty firebase. They won;t be able to do it in one operation though.

