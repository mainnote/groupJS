(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module unless amdModuleId is set
    define([], function () {
      return (root['Grp'] = factory());
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like environments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    root['Grp'] = factory();
  }
}(this, function () {

//for stupid old IE
if (typeof window !== 'undefined' && window) global = window; //for browser
if (!Object.create) {
    Object.create = function(o) {
        if (arguments.length > 1) {
            throw new Error('Object.create implementation only accepts the first parameter.');
        }

        function F() {}
        F.prototype = o;
        return new F();
    };
}
if (!Function.prototype.bind) {
    Function.prototype.bind = function(oThis) {
        if (typeof this !== 'function') {
            // closest thing possible to the ECMAScript 5
            // internal IsCallable function
            throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
        }

        var aArgs = Array.prototype.slice.call(arguments, 1),
            fToBind = this,
            fNOP = function() {},
            fBound = function() {
                return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                    aArgs.concat(Array.prototype.slice.call(arguments)));
            };

        fNOP.prototype = this.prototype;
        fBound.prototype = new fNOP();

        return fBound;
    };
}
if (typeof Array.isArray === 'undefined') {
    Array.isArray = function(obj) {
        return Object.prototype.toString.call(obj) === '[object Array]';
    }
};

function contains(a, obj) {
    var i = a.length;
    while (i--) {
        if (a[i] === obj) {
            return true;
        }
    }
    return false;
}

//---------------------------
// Define base obj
//---------------------------
var obj = {
    create: function(_id) {
        var newObj = Object.create(this);

        //copy all inherited parents list to new object
        if (this.hasOwnProperty('_parentIDs')) {
            newObj._parentIDs = []; //init
            var len = this._parentIDs.length;
            for (var i = 0; i < len; i++) {
                newObj._parentIDs.push(this._parentIDs[i]);
            }
        }

        //add current parent to the parents list
        if (this.hasOwnProperty('_id')) {
            if (!newObj.hasOwnProperty('_parentIDs'))
                newObj._parentIDs = []; //init array for parent list
            newObj._parentIDs.push(this._id);

            if (!_id) {
                _id = this._id; //name from original _id during instance
            }
        }

        newObj._id = _id; //init

        //calling init() method
        if ('init' in newObj && typeof newObj.init === 'function') newObj.init();

        return newObj;
    },

    //extend this object methods and attributes
    //e.g. OBJ.extend({}, {}, {}......)
    //
    extend: function() {
        for (var i = 0; i < arguments.length; i++) {
            var extObj = arguments[i];
            for (var key in extObj) {
                this[key] = extObj[key];

                //perform init() for new object
                if (key === 'init' && typeof this.init === 'function') this.init();
            }
        }
        return this;
    },

    _isReservedAttr: function(attribute) {
        if ((attribute in obj) || (attribute in group) || contains(['_parentIDs', 'obj', 'group', '_memberList', '_id', '_callToMembers'], attribute) || (this.reservedAttr && Array.isArray(this.reservedAttr) && contains(this.reservedAttr, attribute))) {
            return true;
        } else {
            return false;
        }
    },
};

// a handy function to wire up one or more of member to its group

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
            thisGrp.setCallToMember(toMem.memberID, toMem.methodName);
        }
        return true;
    }
    return false;
}
var __NOTFOUND__ = '__NOTFOUND__';

//---------------------------
// Define base group
//---------------------------
var group = obj.create('group');
group.extend({
    //create a new group
    create: function(_groupId) {
        var newGroup = obj.create.apply(this, arguments);
        //all group members should recreated within new group
        if ('_buildMemberList' in newGroup && typeof newGroup._buildMemberList === 'function')
            newGroup._buildMemberList();

        //reset callToMember after group instantial
        _resetCallToMember(newGroup);

        return newGroup;
    },
    _buildMemberList: function() {
        if (!this._memberList) { //base group
            this._memberList = {}; //init member list for this group
        } else if (!this.hasOwnProperty('_memberList')) { //inherited group
            var parentMemberList = this._memberList;
            this._memberList = {}; //init in object level memberList
            for (var key in parentMemberList) {
                var member = parentMemberList[key];
                var newMember = member.create();
                newMember.group = this; //refer to group

                this._memberList[key] = newMember;
            }
        }
    },

    join: function() {
        for (var i = 0; i < arguments.length; i++) {
            var member = arguments[i];
            //add new member in command interface
            var newMember = member.create();
            newMember.group = this;
            this._memberList[member._id] = newMember;
        }

        return this;
    },
    // a convinience way to execute a method for specific member in current group
    call: function(memberID, methodName) {
        if (typeof memberID !== 'string')
            throw 'Group ' + this._id + ' calling ' + memberID + ' Error: member id is not string.';
        if (typeof methodName === 'undefined')
            throw 'Group ' + this._id + ' calling ' + memberID + ' Error: Method name is not provided';

        //call member in this group
        if (memberID in this._memberList) {
            found = true;
            var member = this._memberList[memberID];

            if (methodName in member && typeof member[methodName] === 'function') {
                return member[methodName].apply(member, Array.prototype.slice.call(arguments, 2));
            } else {
                throw 'Group ' + this._id + ' calling ' + memberID + ' Error: Method name ' + methodName + ' is not found';
            }
            //check all members if anyone parent object id matched the memberID (inherited member)
        } else {
            var memberList = this._memberList;
            for (var key in memberList) {
                var member = memberList[key];
                if (member.hasOwnProperty('_parentIDs') && methodName in member && typeof member[methodName] === 'function') {
                    var _parentIDs = member._parentIDs;
                    var p_len = _parentIDs.length;
                    for (var j = 0; j < p_len; j++) {
                        if (memberID === _parentIDs[j]) {
                            return member[methodName].apply(member, Array.prototype.slice.call(arguments, 2));
                        }
                    }
                }
            }
        }
        //if not found, should we leave error?
        throw 'Group ' + this._id + ' does not contain object member ' + memberID;
    },

    //go up level group to find member and execute its method
    upCall: function(memberID, methodName) {
        var result = this._upCall.apply(this, arguments);
        if (typeof result === 'string' && result === __NOTFOUND__) {
            throw 'The upper groups from group ' + this._id + ' does not have member ' + memberID + ' with method ' + methodName;
        } else {
            return result;
        }
    },
    _upCall: function(memberID, methodName) {
        if (memberID in this._memberList) { //check current group members
            return this.call.apply(this, arguments);
        } else {
            if (this.group) { //go up one level
                return this.group._upCall.apply(this.group, arguments);
            } else {
                return __NOTFOUND__;
            }
        }

    },


    //go down level group to find member and execute its method
    downCall: function(memberID, methodName) {
        var result = this._downCall.apply(this, arguments);
        if (typeof result === 'string' && result === __NOTFOUND__) {
            throw 'The downward groups from group ' + this._id + ' does not have member ' + memberID + ' with method ' + methodName;
        } else {
            return result;
        }
    },
    _downCall: function(memberID, methodName) {
        if (memberID in this._memberList) { //check current group members
            return this.call.apply(this, arguments);
        } else {
            var memberList = this._memberList;
            //loop members to find group
            for (var key in memberList) {
                var member = memberList[key];
                    if (member.hasOwnProperty('_memberList')) { //group
                        return member._downCall.apply(member, arguments); //first hit
                    }
            }
            return __NOTFOUND__;
        }

    },

    /* call through to specific member whom play as a major role*/
    setCallToMember: function(memberID, methodName) {
        var that = this;
        var member;

        //memberID may be member
        if (typeof memberID == 'string')
            member = this.getMember(memberID);
        else
            member = memberID;

        if (member) {
            //newly create group object
            if (!this.hasOwnProperty('_callToMembers'))
                this._callToMembers = [];

            function arraySearch(arr, memberID, methodName) {
                for (var i = 0; i < arr.length; i++)
                    if (arr[i].memberID == memberID && arr[i].methodName == methodName)
                        return true;
                return false;
            }

            //ensure no duplicate
            if (!arraySearch(this._callToMembers, memberID, methodName)) {
                this._callToMembers.push({
                    memberID: memberID,
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
                if (!that._isReservedAttr(attribute)) { //skip those attributes exist in group!!!
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

    members: function() {
        function _getMember(thisGroup) {
            var memberList = thisGroup._memberList;
            var ms = [];
            for (var key in memberList) {
                var memberKey = {
                    _id: key,
                };
                var memberObj = memberList[key];
                if (memberObj.hasOwnProperty('_memberList')) {
                    memberKey['members'] = _getMember(memberObj);
                }
                ms.push(memberKey);
            }
            return ms;
        }
        return _getMember(this);
    },

    getMember: function(memberID, memberMap) {
        if (memberMap && Array.isArray(memberMap)) {
            //find the first one in map
            return _findMemberInMap(memberMap, this);

            function _findMemberInMap(map, thisGroup) {
                if (Array.isArray(map) && thisGroup && thisGroup.hasOwnProperty('_memberList')) {
                    var len = map.length;
                    for (var i = 0; i < len; i++) {
                        //if level down
                        if (map[i].hasOwnProperty('members')) {
                            var member = _findMemberInMap(map[i].members, thisGroup.getMember(map[i]._id));
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
            if (memberID in memberList) {
                return memberList[memberID];
            } else {
                for (var key in memberList) {
                    var memberObj = memberList[key];
                    if (memberObj.hasOwnProperty('_memberList')) {
                        var member = _getMember(memberObj);
                        if (member) return member;
                    }
                }
            }
            return null;
        }
    },
});

var Grp = {
    obj: obj,
    group: group
};

return Grp;

}));
