(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function () {
      return (root['Grp'] = factory());
    });
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Grp'] = factory();
  }
}(this, function () {

//for stupid old IE
var TAG = 'groupjs';
if (typeof window !== 'undefined' && window) global = window; //for browser 
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
if (!Function.prototype.bind) {
    Function.prototype.bind = function (oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function () {},
            fBound = function () {
                return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}
if (typeof Array.isArray === 'undefined') {
    Array.isArray = function (obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
};
/*Object.prototype.renameProperty = function (oldName, newName) {
    // Do nothing if the names are the same
    if (oldName == newName) {
        return this;
    }
    // Check for the old property name to avoid a ReferenceError in strict mode.
    if (this.hasOwnProperty(oldName)) {
        this[newName] = this[oldName];
        delete this[oldName];
    }
    return this;
};*/

//----------------------------
function reservedAttr(attribute) {
    if ((attribute in obj) || (attribute in group) || attribute === 'parentNames' || attribute === 'group' || attribute === '_memberList' || attribute === 'name' || attribute === '_callToMembers' || attribute === 'opt' || attribute === 'defaultOpt') {
        return true;
    } else {
        return false;
    }
};


function _resetCallToMember(thisGrp) {
    if ('_callToMembers' in thisGrp) { //reset setCallToMembers and level up
        //clone first since it will reset later
        var tmp_callToMembers = [];
        for (var i = 0, l = thisGrp._callToMembers.length; i < l; i++) {
            tmp_callToMembers[i] = thisGrp._callToMembers[i];
        }
        //apply
        for (var i = 0, l = tmp_callToMembers.length; i < l; i++) {
            var toMem = tmp_callToMembers[i];
            thisGrp.setCallToMember(toMem.memberName, toMem.methodName);
        }
        return true;
    }
    return false;
}

var obj = {
    create: function (name) {
        var newObj = Object.create(this);

        //copy all inherited parents list to new object
        if (this.hasOwnProperty('parentNames')) {
            newObj.parentNames = []; //init
            var len = this.parentNames.length;
            for (var i = 0; i < len; i++) {
                newObj.parentNames.push(this.parentNames[i]);
            }
        }

        //add current parent to the parents list
        if (this.hasOwnProperty('name')) {
            if (!newObj.hasOwnProperty('parentNames'))
                newObj.parentNames = []; //init
            newObj.parentNames.push(this.name);

            if (!name) {
                name = this.name; //name from originate during instance
            }
        }

        newObj.name = name; //init
        if ('init' in newObj && typeof newObj.init === 'function') newObj.init();

        return newObj;
    },
    extend: function () {
        for (var i = 0; i < arguments.length; i++) {
            var extObj = arguments[i];
            for (var key in extObj) {
                this[key] = extObj[key];
                if (key === 'init' && typeof this.init === 'function') this.init();
            }
        }
        return this;
    },
    command: function () {
        var self = this;
        return function (cmd, opt) {
            if (!(cmd in self)) throw 'This object ' + self.name + ' does not have key ' + cmd;

            if (typeof self[cmd] === 'function') {
                if (global.LOG) {
                    var result = self[cmd](opt);
                    if (!(reservedAttr(cmd))) {
                        LOG(TAG, ' Method ' + self.name + '.' + cmd + ' ', opt, result);
                    }
                    return result;
                } else {
                    return self[cmd](opt);
                }
            } else {
                if (global.LOG) {
                    var result = self[cmd];
                    if (!(reservedAttr(cmd))) {
                        LOG(TAG, ' Attribute ' + self.name + '.' + cmd + ' ', '', result);
                    }
                    return result;
                } else {
                    return self[cmd]; //value
                }
            }
        };
    },
    thisObj: function () {
        return this;
    },
};

var group = obj.create('group');
group.extend({
    create: function (name) {
        var newObj = obj.create.apply(this, arguments);
        //all members should recreated within new group
        newObj._buildMemberList();

        //reset callToMember after group instantial
        _resetCallToMember(newObj);

        return newObj;
    },
    _buildMemberList: function () {
        if (!this._memberList) { //base group
            this._memberList = {}; //init
        } else if (!this.hasOwnProperty('_memberList')) { //inherited group
            var prototypeMemberList = this._memberList;
            this._memberList = {}; //init in object level memberList
            for (var key in prototypeMemberList) {
                var memberCmd = prototypeMemberList[key];
                var newMember = memberCmd('create');
                newMember.group = this; //member

                this._memberList[key] = newMember.command();
            }
        }
    },
    /* I don't see there is any neccesary to rename a member as member name will keep forever.
        If rename function happen, it will break the nature of group call function for others.
    renameMember: function (oldMemberName, newMember) {
        if (this._memberList[oldMemberName]) {
            if (newMember) {
                //put newMember into new function
            } else {
                //rename it
                //this._memberList.renameProperty();
            }
        }
    }, */
    join: function () {
        for (var i = 0; i < arguments.length; i++) {
            var member = arguments[i];
            //add new member in command interface
            var newMember = member.create(member.name);
            newMember.group = this;
            this._memberList[member.name] = newMember.command();
        }

        return this;
    },
    call: function (memberName, methodName, opt) {
        var found = false;
        //call member in this group
        if (memberName in this._memberList) {
            found = true;
            var memberCmd = this._memberList[memberName];
            if (global.LOG) {
                var result = memberCmd(methodName, opt);
                LOG(TAG, ' Group ' + this.name + ' [ ' + memberName + '.' + methodName + ' ] ', opt, result);
                return result;
            } else {
                return memberCmd(methodName, opt);
            }
         //check all members if anyone parent matched the memberName (inherited member)
        } else {
            var result;
            var prototypeMemberList = this._memberList;
            for (var key in prototypeMemberList) {
                var memberCmd = prototypeMemberList[key];
                if (typeof memberCmd === 'function') {
                    var member = prototypeMemberList[key]('thisObj');
                    if (member.hasOwnProperty('parentNames') && methodName in member && typeof member[methodName] === 'function') {
                        var parentNames = member.parentNames;
                        var p_len = parentNames.length;
                        for (var j = 0; j < p_len; j++) {
                            if (memberName === parentNames[j]) {
                                found = true;
                                var result = memberCmd(methodName, opt);
                                if (global.LOG) {
                                    LOG(TAG, ' SubGroup ' + this.name + ' [ ' + memberName + '.' + methodName + ' ] ', opt, result);
                                }
                            }
                        }
                        
                    }
                }
            }
            if (found) return result; //last result
        }
        //if not found, should we leave error?
        if (!found) throw 'This group ' + this.name + ' does not have member ' + memberName;
    },

    //go up level group to find member and execute its method
    upCall: function (memberName, methodName, opt) {
        var result = this._upCall(memberName, methodName, opt);
        if (typeof result === 'string' && result === '__NOTFOUND__') {
            throw 'The upper groups from ' + this.name + ' does not have member ' + memberName;
        } else {
            return result;
        }
    },
    _upCall: function (memberName, methodName, opt) {
        if (memberName in this._memberList) { //check current group members
            return this.call(memberName, methodName, opt);
        } else {
            if (this.group) {
                return this.group.upCall(memberName, methodName, opt);
            } else {
                return '__NOTFOUND__';
            }
        }

    },


    //go up level group to find member and execute its method
    downCall: function (memberName, methodName, opt) {
        var result = this._downCall(memberName, methodName, opt);
        if (typeof result === 'string' && result === '__NOTFOUND__') {
            throw 'The downward groups from ' + this.name + ' does not have member ' + memberName;
        } else {
            return result;
        }
    },
    _downCall: function (memberName, methodName, opt) {
        if (memberName in this._memberList) { //check current group members
            return this.call(memberName, methodName, opt);
        } else {
            var prototypeMemberList = this._memberList;
            //loop members to find group
            for (var key in prototypeMemberList) {
                var memberCmd = prototypeMemberList[key];
                if (typeof memberCmd === 'function') {
                    var member = prototypeMemberList[key]('thisObj');
                    if (member.hasOwnProperty('_memberList')) { //group
                        return member._downCall(memberName, methodName, opt); //first hit
                    }
                }
            }
            return '__NOTFOUND__';
        }

    },

    /* call through to specific member whom play as a major role*/
    setCallToMember: function (memberName, methodName) {
        var that = this;
        var member = this.call(memberName, 'thisObj');
        if (member) {
            //newly create group object
            if (!this.hasOwnProperty('_callToMembers'))
                this._callToMembers = [];

            function arraySearch(arr, memberName, methodName) {
                for (var i = 0; i < arr.length; i++)
                    if (arr[i].memberName == memberName && arr[i].methodName == methodName)
                        return true;
                return false;
            }

            //ensure no duplicate
            if (!arraySearch(this._callToMembers, memberName, methodName)) {
                this._callToMembers.push({
                    memberName: memberName,
                    methodName: methodName
                });
            }

            if (methodName) {
                _setMethod(methodName, member); //override specific attribute. Even the one might exist.
            } else {
                for (var key in member) {
                    _setMethod(key, member);
                }
            }

            function _setMethod(attribute, memberObj) {
                if (!reservedAttr(attribute)) { //skip those attributes exist in group!!!
                    if (typeof memberObj[attribute] === 'function' && !memberObj[attribute].binded) {
                        that[attribute] = memberObj[attribute].bind(memberObj);
                        that[attribute].binded = true;
                    } else {
                        that[attribute] = memberObj[attribute];
                    }
                }
            }
        }

        return this;
    },

    members: function () {
        function _getMember(thisGroup) {
            var memberList = thisGroup._memberList;
            var ms = [];
            for (var key in memberList) {
                var member = {
                    name: key,
                };
                var memberObj = memberList[key]('thisObj');
                if (memberObj.hasOwnProperty('_memberList')) {
                    member['members'] = _getMember(memberObj);
                }
                ms.push(member);
            }
            return ms;
        }
        return _getMember(this);
    },

    getMember: function (memberName, memberMap) {
        if (memberMap && Array.isArray(memberMap)) {
            //find the first one in map
            return _findMemberInMap(memberMap, this);

            function _findMemberInMap(map, thisGroup) {
                if (Array.isArray(map) && thisGroup && thisGroup.hasOwnProperty('_memberList')) {
                    var len = map.length;
                    for (var i = 0; i < len; i++) {
                        //if level down
                        if (map[i].hasOwnProperty('members')) {
                            var member = _findMemberInMap(map[i].members, thisGroup.call(map[i].name, 'thisObj'));
                            if (member)
                                return member;
                        } else {
                            return _getMember(thisGroup);
                        }
                    }
                }
                return null;
            }
        } else {
            //get the first matched member if memberMap not specified
            return _getMember(this);
        }

        function _getMember(thisGroup) {
            var memberList = thisGroup._memberList;
            if (memberName in memberList) {
                return memberList[memberName]('thisObj');
            } else {
                for (var key in memberList) {
                    var memberObj = memberList[key]('thisObj');
                    if (memberObj.hasOwnProperty('_memberList')) {
                        var member = _getMember(memberObj);
                        if (member) return member;
                    }
                }
            }
            return null;
        }
    },

    override: function (newMember, memberMap, newMemberName) {
        if (newMember) {
            if (memberMap && Array.isArray(memberMap)) {
                //only override the ones in map
                _overrideMemberInMap(memberMap, this);

                function _overrideMemberInMap(map, thisGroup) {
                    if (Array.isArray(map) && thisGroup && thisGroup.hasOwnProperty('_memberList')) {
                        var len = map.length;
                        for (var i = 0; i < len; i++) {
                            //if level down
                            if (map[i].hasOwnProperty('members')) {
                                _overrideMemberInMap(map[i].members, thisGroup.call(map[i].name, 'thisObj'));
                            } else {
                                _overrideMember(thisGroup);
                            }
                        }
                    }
                }

            } else {
                //override all member with the same name
                _overrideMember(this);
            }

            function _overrideMember(thisGroup) {
                var reset = false;
                if (thisGroup.hasOwnProperty('_memberList')) {
                    for (var key in thisGroup._memberList) {
                        var memberObj = thisGroup._memberList[key]('thisObj');
                        if (memberObj.name === newMember.name) {
                            thisGroup.join(newMember);
                            reset = _resetCallToMember(thisGroup);
                        } else if (memberObj.hasOwnProperty('_memberList')) {
                            if (_overrideMember(memberObj)) {
                                reset = _resetCallToMember(thisGroup);
                            }
                        }
                    }

                }

                return reset;
            }
        }

        return this;
    },
});

var Grp = {
    obj: obj,
    group: group
};

return Grp;

}));
