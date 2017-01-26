<p align="center">
  <img src="https://github.com/mainnote/groupJS/blob/master/logo.png" alt="groupJS logo" />
</p>

### About groupJS

GroupJS is a javascript module for structuring javascript modules into a "group". Simply put, we want a group as a component which is composited by javascript modules which can be overriden.

For example, group A includes module A1, A2 and A3. A1, A2 and A3 interact internally. You can create module A11 replace A1 in group A.

Group A can be "inherited". E.g. you create group AA with the same function as group A. group AA can extend its method and attributes without interfering with group A.

# Documentation

## Usages
#### Object Inheritance

* `obj.create(<object id>)` - Create a new object. <object id> should be identifier of an object.
    ```javascript
    var newObj = Grp.obj.create('newObj');
    var newObj_1 = newObj.create('newObj_1');
    ```

* `obj.extend( obj1 [, obj2, ......] )` - extend object's attributes. If attribute exists, it will be overriden.    
    ```javascript
    var newObj = Grp.obj.create('newObj');
    newObj.extend({
        newAttribute: function() {
        alert('this is a new attribute');
        },
    });
    ```

* `obj.reservedAttr` - Array of string to reserved attributes or methods names for this module.

* `obj.init()` - initialize local variable

#### Group

* `group.create(<group id>)` - create a new group

* `group.join(<member or sub-Group>[, <member2 or sub-Group2>...])` - join a memeber into this group. If member name exists, the member will be overriden.

    ```javascript
    //create a member
    var newObj = Grp.obj.create('newObj');
    newObj.extend({
        newAttribute: function(opt) {
            alert('this is a new attribute for ' + opt._id||'');
        },
    });

    //create a group
    var newGrp = Grp.group.create('newGrp');
    newGrp.join(newObj);
    newGrp.extend({
        promptAlert: function(opt) {
            this.call('newObj', 'newAttribute', opt );
        },
    });

    var grpTest = newGrp.create('grpTest');
    var opt = { name: 'grpTest_Name' };
    grpTest.promptAlert(opt);
    ```

* `group.call()`  - call its own member command. If inherited, the member will still be called based on parents list. return its result or the last call's result.

    * For group level, `this.call(<member or memberID>, <methodName>, opt)`
    * For member level, `this.group.call(<member or memberID>, <methodName>, opt)`

* `group.upCall()`  - call its own member command or find in upper group's member command.  First hit will be return.!!!

    * For group level, `this.upCall(<memberName>, <methodName>, opt)`
    * For member level, `this.group.upCall(<memberName>, <methodName>, opt)`

* `group.downCall()`  - call its own member command or find in sub group's member command. First hit will be return.!!!

    * For group level, `this.downCall(<memberName>, <methodName>, opt)`
    * For member level, `this.group.downCall(<memberName>, <methodName>, opt)`

* `group.group` - for member, it refers to its group; for group, refers to its parent group.  

* `group.members()` - show a map of this group's members.

* `group.getMember(memberName[, memberMap])` - get a member by name.


## Examples
1. [Check the test cases and you might get some idea](test/specs/global/globalSpec.js)
2. [Check example folder](examples/)
3. In node.js
    npm install groupjs

    ```javascript
    var Grp = require('groupjs');
    ```
4. with requirejs
    require(['groupjs'], function(Grp){});

## Build

    grunt

## Release

    To npm, change version number
    npm publish ./

    Register in bower
    bower register groupjs git://github.com/mainnote/groupJS.git

    Change version in bower,
    git tag -a 0.1.01 -m "Tagging 0.1.01"


## Test

    grunt test
    or
    grunt watch

## Contributors

George Zhang < service@mainnote.com >
