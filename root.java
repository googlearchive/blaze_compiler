package com.firebase.fluent;
import com.firebase.client.Firebase;
import java.util.HashMap;
import java.util.Map;
public class root {
 public static _fluent_classes.root$aStr aStr = new _fluent_classes.root$aStr();
 public static _fluent_classes.root$aComposite aComposite = new _fluent_classes.root$aComposite();
 public static _fluent_classes.root$$userid $(String key) {return null;}
public static class _fluent_classes {
public static class root$$Builder0 extends SubBuilderIdentity {
 root$$Builder0(Ref ref) {
   super(ref, null);
 }
 public root$$Builder1 setAStr(String val) {
   return new root$$Builder1(parent.parent, parent, "aStr", val);
 }
 public root$$Builder2 openAComposite() {
   return new root$$Builder2(this);
 }
 public root$$Builder13 close$userid() {
   return new root$$Builder13(parent.parent, parent);
 }
}
public static class root$$Builder1 extends SubBuilderIntermediate {
 root$$Builder1(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$Builder2 openAComposite() {
   return new root$$Builder2(this);
 }
 public root$$Builder13 close$userid() {
   return new root$$Builder13(parent.parent, parent);
 }
}
public static class root$$Builder2 extends SubBuilderIdentity {
 root$$Builder2(SubBuilder parent) {
   super(parent.ref, parent);
 }
 public root$$Builder3 setANum(Double val) {
   return new root$$Builder3(parent.parent, parent, "aNum", val);
 }
 public root$$Builder3 setANum(Integer val) {
   return new root$$Builder3(parent.parent, parent, "aNum", val);
 }
 public root$$Builder4 setAStr(String val) {
   return new root$$Builder4(parent.parent, parent, "aStr", val);
 }
 public root$$Builder5 closeAComposite() {
   return new root$$Builder5(parent.parent, parent);
 }
}
public static class root$$Builder3 extends SubBuilderIntermediate {
 root$$Builder3(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$Builder4 setAStr(String val) {
   return new root$$Builder4(parent.parent, parent, "aStr", val);
 }
 public root$$Builder5 closeAComposite() {
   return new root$$Builder5(parent.parent, parent);
 }
}
public static class root$$Builder4 extends SubBuilderIntermediate {
 root$$Builder4(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$Builder5 closeAComposite() {
   return new root$$Builder5(parent.parent, parent);
 }
}
public static class root$$Builder5 extends SubBuilderLast<root$$Value> {

 root$$Builder5(SubBuilder parent, SubBuilder prev) {
   super(parent, prev);
 }
 public root$$Value write() {
   return new root$$Value(this);
 }
}
public static class root$$Builder6 extends SubBuilderIdentity {
 root$$Builder6(SubBuilder parent) {
   super(parent.ref, parent);
 }
 public root$$Builder7 setName(String val) {
   return new root$$Builder7(parent.parent, parent, "name", val);
 }
}
public static class root$$Builder7 extends SubBuilderIntermediate {
 root$$Builder7(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$Builder8 setAge(Double val) {
   return new root$$Builder8(parent.parent, parent, "age", val);
 }
 public root$$Builder8 setAge(Integer val) {
   return new root$$Builder8(parent.parent, parent, "age", val);
 }
 public root$$Builder9 openAddress() {
   return new root$$Builder9(this);
 }
 public root$$Builder13 close$userid() {
   return new root$$Builder13(parent.parent, parent);
 }
}
public static class root$$Builder8 extends SubBuilderIntermediate {
 root$$Builder8(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$Builder9 openAddress() {
   return new root$$Builder9(this);
 }
 public root$$Builder13 close$userid() {
   return new root$$Builder13(parent.parent, parent);
 }
}
public static class root$$Builder9 extends SubBuilderIdentity {
 root$$Builder9(SubBuilder parent) {
   super(parent.ref, parent);
 }
 public root$$Builder10 setStreet(String val) {
   return new root$$Builder10(parent.parent, parent, "street", val);
 }
 public root$$Builder11 setZip(String val) {
   return new root$$Builder11(parent.parent, parent, "zip", val);
 }
 public root$$Builder12 closeAddress() {
   return new root$$Builder12(parent.parent, parent);
 }
}
public static class root$$Builder10 extends SubBuilderIntermediate {
 root$$Builder10(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$Builder11 setZip(String val) {
   return new root$$Builder11(parent.parent, parent, "zip", val);
 }
 public root$$Builder12 closeAddress() {
   return new root$$Builder12(parent.parent, parent);
 }
}
public static class root$$Builder11 extends SubBuilderIntermediate {
 root$$Builder11(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$Builder12 closeAddress() {
   return new root$$Builder12(parent.parent, parent);
 }
}
public static class root$$Builder12 extends SubBuilderLast<root$$Value> {

 root$$Builder12(SubBuilder parent, SubBuilder prev) {
   super(parent, prev);
 }
 public root$$Value write() {
   return new root$$Value(this);
 }
}
public static class root$$Builder13 extends SubBuilderLast<root$$Value> {

 root$$Builder13(SubBuilder parent, SubBuilder prev) {
   super(parent, prev);
 }
 public root$$Value write() {
   return new root$$Value(this);
 }
}
public static class root$$Builder14 extends SubBuilderLast<root$$Value> {

 root$$Builder14(SubBuilder prev) {
   super(null, prev);
 }
 public root$$Value value() {
   return new root$$Value(this);
 }
}
   public static class root$$Value extends Val {
     root$$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$ extends Ref<root$$Builder0> {
     root$() {
       super(new Firebase(""));
     }
     public root$aStr aStr = new root$aStr();
     public root$aComposite aComposite = new root$aComposite();
     public root$$userid $(String key) {return null;}
     public root$$Builder0 openWrite() {
       return new root$$Builder0(this);
     }
   }
   public static class root$aStr$Value extends Val {
     root$aStr$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$aStr {
 public void write(String val) {
 }
   }
public static class root$aComposite$Builder0 extends SubBuilderIdentity {
 root$aComposite$Builder0(Ref ref) {
   super(ref, null);
 }
 public root$aComposite$Builder1 setANum(Double val) {
   return new root$aComposite$Builder1(parent.parent, parent, "aNum", val);
 }
 public root$aComposite$Builder1 setANum(Integer val) {
   return new root$aComposite$Builder1(parent.parent, parent, "aNum", val);
 }
 public root$aComposite$Builder2 setAStr(String val) {
   return new root$aComposite$Builder2(parent.parent, parent, "aStr", val);
 }
 public root$aComposite$Value write() {
   return new root$aComposite$Value(parent.parent);
 }
}
public static class root$aComposite$Builder1 extends SubBuilderIntermediate {
 root$aComposite$Builder1(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$aComposite$Builder2 setAStr(String val) {
   return new root$aComposite$Builder2(parent.parent, parent, "aStr", val);
 }
 public root$aComposite$Value write() {
   return new root$aComposite$Value(parent.parent);
 }
}
public static class root$aComposite$Builder2 extends SubBuilderIntermediate {
 root$aComposite$Builder2(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$aComposite$Value write() {
   return new root$aComposite$Value(parent.parent);
 }
}
public static class root$aComposite$Builder3 extends SubBuilderLast<root$aComposite$Value> {

 root$aComposite$Builder3(SubBuilder prev) {
   super(null, prev);
 }
 public root$aComposite$Value value() {
   return new root$aComposite$Value(this);
 }
}
   public static class root$aComposite$Value extends Val {
     root$aComposite$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$aComposite extends Ref<root$aComposite$Builder0> {
     root$aComposite() {
       super(new Firebase("aComposite"));
     }
     public root$aComposite$aNum aNum = new root$aComposite$aNum();
     public root$aComposite$aStr aStr = new root$aComposite$aStr();
     public root$aComposite$Builder0 openWrite() {
       return new root$aComposite$Builder0(this);
     }
   }
   public static class root$aComposite$aNum$Value extends Val {
     root$aComposite$aNum$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$aComposite$aNum {
 public void write(Double val) {
 }
 public void write(Integer val) {
 }
   }
   public static class root$aComposite$aStr$Value extends Val {
     root$aComposite$aStr$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$aComposite$aStr {
 public void write(String val) {
 }
   }
public static class root$$userid$Builder0 extends SubBuilderIdentity {
 root$$userid$Builder0(Ref ref) {
   super(ref, null);
 }
 public root$$userid$Builder1 setName(String val) {
   return new root$$userid$Builder1(parent.parent, parent, "name", val);
 }
}
public static class root$$userid$Builder1 extends SubBuilderIntermediate {
 root$$userid$Builder1(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$userid$Builder2 setAge(Double val) {
   return new root$$userid$Builder2(parent.parent, parent, "age", val);
 }
 public root$$userid$Builder2 setAge(Integer val) {
   return new root$$userid$Builder2(parent.parent, parent, "age", val);
 }
 public root$$userid$Builder3 openAddress() {
   return new root$$userid$Builder3(this);
 }
 public root$$userid$Value write() {
   return new root$$userid$Value(parent.parent);
 }
}
public static class root$$userid$Builder2 extends SubBuilderIntermediate {
 root$$userid$Builder2(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$userid$Builder3 openAddress() {
   return new root$$userid$Builder3(this);
 }
 public root$$userid$Value write() {
   return new root$$userid$Value(parent.parent);
 }
}
public static class root$$userid$Builder3 extends SubBuilderIdentity {
 root$$userid$Builder3(SubBuilder parent) {
   super(parent.ref, parent);
 }
 public root$$userid$Builder4 setStreet(String val) {
   return new root$$userid$Builder4(parent.parent, parent, "street", val);
 }
 public root$$userid$Builder5 setZip(String val) {
   return new root$$userid$Builder5(parent.parent, parent, "zip", val);
 }
 public root$$userid$Builder6 closeAddress() {
   return new root$$userid$Builder6(parent.parent, parent);
 }
}
public static class root$$userid$Builder4 extends SubBuilderIntermediate {
 root$$userid$Builder4(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$userid$Builder5 setZip(String val) {
   return new root$$userid$Builder5(parent.parent, parent, "zip", val);
 }
 public root$$userid$Builder6 closeAddress() {
   return new root$$userid$Builder6(parent.parent, parent);
 }
}
public static class root$$userid$Builder5 extends SubBuilderIntermediate {
 root$$userid$Builder5(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$userid$Builder6 closeAddress() {
   return new root$$userid$Builder6(parent.parent, parent);
 }
}
public static class root$$userid$Builder6 extends SubBuilderLast<root$$userid$Value> {

 root$$userid$Builder6(SubBuilder parent, SubBuilder prev) {
   super(parent, prev);
 }
 public root$$userid$Value write() {
   return new root$$userid$Value(this);
 }
}
public static class root$$userid$Builder7 extends SubBuilderLast<root$$userid$Value> {

 root$$userid$Builder7(SubBuilder prev) {
   super(null, prev);
 }
 public root$$userid$Value value() {
   return new root$$userid$Value(this);
 }
}
   public static class root$$userid$Value extends Val {
     root$$userid$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$$userid extends Ref<root$$userid$Builder0> {
     root$$userid() {
       super(new Firebase("$userid"));
     }
     public root$$userid$name name = new root$$userid$name();
     public root$$userid$age age = new root$$userid$age();
     public root$$userid$address address = new root$$userid$address();
     public root$$userid$Builder0 openWrite() {
       return new root$$userid$Builder0(this);
     }
   }
   public static class root$$userid$name$Value extends Val {
     root$$userid$name$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$$userid$name {
 public void write(String val) {
 }
   }
   public static class root$$userid$age$Value extends Val {
     root$$userid$age$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$$userid$age {
 public void write(Double val) {
 }
 public void write(Integer val) {
 }
   }
public static class root$$userid$address$Builder0 extends SubBuilderIdentity {
 root$$userid$address$Builder0(Ref ref) {
   super(ref, null);
 }
 public root$$userid$address$Builder1 setStreet(String val) {
   return new root$$userid$address$Builder1(parent.parent, parent, "street", val);
 }
 public root$$userid$address$Builder2 setZip(String val) {
   return new root$$userid$address$Builder2(parent.parent, parent, "zip", val);
 }
 public root$$userid$address$Value write() {
   return new root$$userid$address$Value(parent.parent);
 }
}
public static class root$$userid$address$Builder1 extends SubBuilderIntermediate {
 root$$userid$address$Builder1(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$userid$address$Builder2 setZip(String val) {
   return new root$$userid$address$Builder2(parent.parent, parent, "zip", val);
 }
 public root$$userid$address$Value write() {
   return new root$$userid$address$Value(parent.parent);
 }
}
public static class root$$userid$address$Builder2 extends SubBuilderIntermediate {
 root$$userid$address$Builder2(SubBuilder parent, SubBuilder prev, String key, Object val) {
   super(parent, prev, key, val);
 }
 public root$$userid$address$Value write() {
   return new root$$userid$address$Value(parent.parent);
 }
}
public static class root$$userid$address$Builder3 extends SubBuilderLast<root$$userid$address$Value> {

 root$$userid$address$Builder3(SubBuilder prev) {
   super(null, prev);
 }
 public root$$userid$address$Value value() {
   return new root$$userid$address$Value(this);
 }
}
   public static class root$$userid$address$Value extends Val {
     root$$userid$address$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$$userid$address extends Ref<root$$userid$address$Builder0> {
     root$$userid$address() {
       super(new Firebase("$userid/address"));
     }
     public root$$userid$address$street street = new root$$userid$address$street();
     public root$$userid$address$zip zip = new root$$userid$address$zip();
     public root$$userid$address$Builder0 openWrite() {
       return new root$$userid$address$Builder0(this);
     }
   }
   public static class root$$userid$address$street$Value extends Val {
     root$$userid$address$street$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$$userid$address$street {
 public void write(String val) {
 }
   }
   public static class root$$userid$address$zip$Value extends Val {
     root$$userid$address$zip$Value(SubBuilder prev) {
       super(prev);
     }
   }
   public static class root$$userid$address$zip {
 public void write(String val) {
 }
   }
}
public static abstract class Ref<BuilderIdentity> {
    Firebase ref;
    Ref(Firebase ref) {
        this.ref = ref;
    }
    //abstract BuilderIdentity buildValue();
}

public static class Val {
    SubBuilder previous;
    Val(SubBuilder previous) {
        this.previous = previous;
    }
    public void write() {
        previous.ref.ref.setValue(previous.properties);
    }
}

public static class SubBuilder {
    Ref ref;
    SubBuilder parent;
    Map<String, Object> properties;
    SubBuilder(Ref ref, SubBuilder parent, Map<String, Object> properties) {
        this.ref = ref;
        this.parent = parent;
        this.properties = properties;
    }
}
public static class SubBuilderIdentity extends SubBuilder{
    SubBuilderIdentity(Ref ref, SubBuilder parent) {
        super(ref, parent, new HashMap<String, Object>());
    }
}
public static class SubBuilderIntermediate<Property> extends SubBuilder{
    SubBuilderIntermediate(SubBuilder parent, SubBuilder prev, String key, Property val) {
        super(prev.ref, parent, prev.properties);
        prev.properties.put(key, val);
    }
}
public static abstract class SubBuilderLast<Value> extends SubBuilder{
    SubBuilderLast(SubBuilder parent, SubBuilder prev) {
        super(prev.ref, parent, prev.properties);
    }
}
 public static _fluent_classes.root$$Builder0 openWrite() {
   return new _fluent_classes.root$$Builder0(new _fluent_classes.root$());
 }
}