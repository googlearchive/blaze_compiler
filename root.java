import java.util.HashMap;
import java.util.Map;

abstract class Ref<BuilderIdentity> {
    Firebase ref;
    Ref(Firebase ref) {
        this.ref = ref;
    }

    abstract BuilderIdentity buildValue();
}

class Val {
    Map<String, Object> properties;
    Ref ref;
    Val(Ref ref, Map<String, Object> properties) {
        this.ref = ref;
        this.properties = properties;
    }

    public void write() {
        ref.ref.setValue(properties);
    }
}

class Builder {
    Map<String, Object> properties;
    Builder(Map<String, Object> properties) {
        this.properties = properties;
    }
}

class TopBuilder extends Builder{
    Ref ref;
    TopBuilder(Ref ref, Map<String, Object> properties) {
        super(properties);
        this.ref = ref;
    }
}
class BuilderIdentity extends TopBuilder {
    BuilderIdentity(Ref ref) {
        super(ref, new HashMap<String, Object>());
    }
}

class BuilderIntermediate<Property> extends TopBuilder {
    BuilderIntermediate(Ref ref, Map<String, Object> properties, String key, Property val) {
        super(ref, properties);
        properties.put(key, val);
    }
}

abstract class BuilderLast<Property, Value extends Val> extends BuilderIntermediate<Property> {
    BuilderLast(Ref ref, Map<String, Object> properties, String key, Property val) {
        super(ref, properties, key, val);
    }

    public abstract Value value();
    public void write() {
        this.value().write();
    }
}

class SubBuilder extends Builder{
    Builder parent;
    SubBuilder(Builder parent, Map<String, Object> properties) {
        super(properties);
        this.parent = parent;
    }
}
class SubBuilderIdentity extends SubBuilder{
    SubBuilderIdentity(Builder parent) {
        super(parent, new HashMap<String, Object>());
    }
}
class SubBuilderIntermediate<Property> extends SubBuilder{
    SubBuilderIntermediate(Builder parent, Map<String, Object> properties, String key, Property val) {
        super(parent, properties);
        properties.put(key, val);
    }
}

abstract class SubBuilderLast<Property, Value extends BuilderIntermediate> extends SubBuilder{
    SubBuilderLast(Builder parent, Map<String, Object> properties, String key, Property val) {
        super(parent, properties);
        properties.put(key, val);
    }

    public abstract Value value();
}

class root$child_string$Builder1 extends BuilderIdentity {
    root$child_string$Builder1(Ref ref) {
        super(ref);
    }

    public root$child_string$Builder2 name(String val) {
        return new root$child_string$Builder2(this.ref, this.properties, "name", val);
    }
}

class root$child_string$Builder2 extends BuilderIntermediate<String> {
    root$child_string$Builder2(Ref ref, Map<String, Object> properties, String key, String val) {
        super(ref, properties, key, val);
    }

    public root$child_string$Builder3 age(int val) {
        return new root$child_string$Builder3(this.ref, this.properties, "age", val);
    }
}

class root$child_string$Builder3 extends BuilderLast<Integer, root$child_string$Value> {
    root$child_string$Builder3(Ref ref, Map<String, Object> properties, String key, Integer val) {
        super(ref, properties, key, val);
    }
    public root$child_string$Value value() {
        return new root$child_string$Value(this.ref, this.properties);
    }
}

class root$child_string$Value extends Val {

    root$child_string$Value(Ref ref, Map<String, Object> properties) {
        super(ref, properties);
    }
}


class root$$userid$Builder1 extends BuilderIdentity {
    root$$userid$Builder1(Ref ref) {
        super(ref);
    }

    public root$$userid$Builder2User1 buildUser() {
        return new root$$userid$Builder2User1(this);
    }
}

class root$$userid$Builder2User1 extends SubBuilderIdentity {

    root$$userid$Builder2User1(Builder parent) {
        super(parent);
    }

    public root$$userid$Builder2User2 age(Integer val) {
        return new root$$userid$Builder2User2(parent, properties, "age", val);
    }
}
class root$$userid$Builder2User2 extends SubBuilderLast {

    root$$userid$Builder2User2(Builder parent, Map<String, Object> properties, String key, Object val) {
        super(parent, properties, key, val);
    }

    @Override
    public root$$userid$Builder3 value() {
        return new root$$userid$Builder3(parent.ref, parent.properties, "user", this.properties);
    }
}

class root$$userid$Builder3 extends BuilderLast {
    root$$userid$Builder3(Ref ref, Map properties, String key, Object val) {
        super(ref, properties, key, val);
    }

    @Override
    public Val value() {
        return new root$$userid$Value(ref, properties);
    }
}

class root$$userid$Value extends Val {
    root$$userid$Value(Ref ref, Map<String, Object> properties) {
        super(ref, properties);
    }
}


class root$child_string$ extends Ref<root$child_string$Builder1> {
    root$child_string$() {
        super(new Firebase("/child_string"));
    }

    @Override
    root$child_string$Builder1 buildValue() {
        return new root$child_string$Builder1(this);
    }
}

class root$$userid$ extends Ref<root$$userid$Builder1> {
    private String userid;
    root$$userid$(String userid) {
        super(new Firebase("/" + userid));
    }

    public root$$userid$docid$ $(String docid) { return new root$$userid$docid$(userid, docid);}

    @Override
    root$$userid$Builder1 buildValue() {
        return new root$$userid$Builder1(this);
    }
}

class root$$userid$docid${
    root$$userid$docid$(String userid, String docid) {
        Firebase ref = new Firebase("/" + userid + "/" + docid);
    }
}

class root${
    public root$child_string$ child_string = new root$child_string$();
    public root$$userid$ $(String userid) { return new root$$userid$(userid);}
}

class root{
    public static root$child_string$ child_string = new root$child_string$();
    public static root$$userid$ $(String userid) { return new root$$userid$(userid);}
}

class Firebase {
    static {
        root.child_string.buildValue()
                             .name("john")
                             .age(12)
                         .write();

        root.$("john").buildValue()
                         .buildUser()
                             .age(12)
                         .value()
                      .write();
    }


    Firebase(String path) {

    }

    public Firebase child(String seg) {
        return new Firebase(seg);
    }

    public void setValue(Object seg) {
    }
}
