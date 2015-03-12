
package fluent;
//import com.firebase.Firebase;
import java.util.HashMap;
import java.util.Map;

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

abstract class Ref<BuilderIdentity> {
    Firebase ref;
    Ref(Firebase ref) {
        this.ref = ref;
    }
    abstract BuilderIdentity buildValue();
}

class Val {
    SubBuilder previous;
    Val(SubBuilder previous) {
        this.previous = previous;
    }
    public void write() {
        previous.ref.ref.setValue(previous.properties);
    }
}

class SubBuilder {
    Ref ref;
    SubBuilder parent;
    Map<String, Object> properties;
    SubBuilder(Ref ref, SubBuilder parent, Map<String, Object> properties) {
        this.ref = ref;
        this.parent = parent;
        this.properties = properties;
    }
}
class SubBuilderIdentity extends SubBuilder{
    SubBuilderIdentity(Ref ref, SubBuilder parent) {
        super(ref, parent, new HashMap<String, Object>());
    }
}
class SubBuilderIntermediate<Property> extends SubBuilder{
    SubBuilderIntermediate(SubBuilder parent, SubBuilder prev, String key, Property val) {
        super(prev.ref, parent, prev.properties);
        prev.properties.put(key, val);
    }
}
abstract class SubBuilderLast<Property, Value> extends SubBuilderIntermediate<Property>{
    SubBuilderLast(SubBuilder parent, SubBuilder prev, String key, Property val) {
        super(parent, prev, key, val);
    }
    public abstract Value value(); //return parent builder context or a Value object
}