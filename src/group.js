//for stupid old IE
if (!Object.create) {
    Object.create = function (o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }
        function F() {}
        F.prototype = o;
        return new F();
    };
}
//----------------------------

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

var Grp = { obj:obj, group: group };