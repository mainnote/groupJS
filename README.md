<p align="center">
  <img src="https://github.com/mainnote/groupJS/blob/master/logo.png" alt="groupJS logo" />
</p>

### About groupJS

GroupJS is an implementation pattern of grouping objects for so-called "instances" purpose. Instead of putting all attributes in a single object, it is recommended to create an object as a group object to manage and connect other objects called members. In the group object, there is a member list to maintain the relationship between group object and its members. Group object acts as a communicator between members. It also provides a single interface outside the group. Thus, object gets its own freedom of evolving its function without changing interaction of another object (class). 

### Why do I need groupJS

(As you may already know that javascript takes prototypal inheritance, it creates flexible programming style. However, I am not a big fans of coding with .prototype. all the time (say composition). This method drains up my brain. Thus, I started looking for an implementation pattern fitting myself. 

At first I jumped in the area of Backbone.js and its best friend marionette. They are kind of "Event Driven" as far as I understand, which turn object having receiving message function. They are surly a brilliant set. But I think they are still too flexible in terms of coding style. That is why I came up with a simple idea: "Create a object group to bridge other objects.")

# Documentation

### Take a look at basic code
```javascript
var obj = {
    create: function(name){
        var newObj = Object.create(this);
        if (!name && this.hasOwnProperty('name')) {
            name = this.name; //name from originate during instance
        }
        newObj.name = name;
        return newObj;
    },
    extend: function() {
        for(var i=0; i<arguments.length; i++)
            var extObj = arguments[i];
            for(var key in extObj)
                this[key] = extObj[key];
    },
    command: function() {
        var self = this;
        return function(cmd, opt) {
            return self[cmd](opt);
        };
    },
    thisObj: function() { //for debug
        return this;
    },
};

var group = obj.create('group');
group.extend({
    create: function(name) {
        var newObj = obj.create.apply(this, arguments);
        //all members should recreated within new group
        newObj._buildMemberList();
        
        return newObj;
    },
    _buildMemberList: function() {
        if (!this._memberList){ //base group
            this._memberList = {};
        }
        else if (!this.hasOwnProperty('_memberList')) { //inherited group
            var prototypeMemberList = this._memberList;
            this._memberList = {}; //in object level memberList
            for (var key in prototypeMemberList) {
                var memberCmd = prototypeMemberList[key];
                var newMember = memberCmd('create');
                newMember.group = this; //member
                
                this._memberList[key] = newMember.command();
            }
        }
    },
    join: function(member) {
        //add new member in command interface
        var newMember = member.create(member.name);
        newMember.group = this;
        this._memberList[member.name] = newMember.command();
    },
    call: function(memberName, methodName, opt) {
        var memberCmd = this._memberList[memberName];
        return memberCmd(methodName, opt);
    },
});
```

## Usages
#### Object Inheritance

* `obj.create(<object name>)` - Create a new object. <object name> should be identifier of an object. 
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

* `obj.command()` - return a function which provides simple and restricted interface.

    ```javascript
    var newObj = Grp.obj.create('newObj');
    newObj.extend({
        newAttribute: function(opt) {
            alert('this is a new attribute for ' + opt.name||'');
        },
    });
    
    var newObjCmd = newObj.command();
    newObjCmd('newAttribute', { name: 'george' }); //calling the object
    ```
    
* `obj.thisObj` - for debug purpose, you may want to access object itself. There is an attribute "thisObj" to return object itself.

    ```javascript
    newObjCmd('thisObj'); //return newObj
    ```

* `obj.parentNames` - Array to keep all inherited object's name.
    
#### Group
* `group.join(<member or sub-Group>[, <member2 or sub-Group2>...])` - join a memeber into this group. If member name exists, the member will be overriden.

    ```javascript
    //create a member
    var newObj = Grp.obj.create('newObj');
    newObj.extend({
        newAttribute: function(opt) {
            alert('this is a new attribute for ' + opt.name||'');
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
    
    var grpTest = newGrp.create('grpTest').command();
    var opt = { name: 'grpTest_Name' };
    grpTest('promptAlert', opt);
    ```
* `group.call()`  - call its own member command

    * For group level, `this.call(<memberName>, <memberAttribute>, opt)` 
    * For member level, `this.group.call(<memberName>, <memberAttribute>, opt)`

* `group.group` - for member, it refers to its group; for group, refers to its parent group.  

* `group.setCallToMember(<memberName>, [<methodName>])`  - a convenient way to port all functions/single method of a specific member to group level

    * <methodName> is optional.

* `group.members()` - show a map of this group's members. This is to be used in `group.override(newMember, memberMap)` .

* `group.override(newMember[, memberMap])` - override a member in this group. This function will go deep to each level and replace the member with the same name. If memberMap is specified, only the specified path will be search for overridden. 

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
    git tag -a 0.0.6 -m "Tagging 0.0.5"


## Test

    grunt test
    or
    grunt watch

## Contributors

George Zhang < service@mainnote.com >