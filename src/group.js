//for stupid old IE
var TAG = 'groupjs';
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
//----------------------------
function reservedAttr(attribute) {
    if ((attribute in obj) || (attribute in group) || attribute === 'parentNames' || attribute === 'group' || attribute === '_memberList' || attribute === 'name' || attribute === '_callToMembers') {
        return true;
    } else {
        return false;
    }
};


function _resetCallToMember(thisGrp) {
    if ('_callToMembers' in thisGrp) { //reset setCallToMembers and level up
        var len = thisGrp._callToMembers.length;
        for (var i = 0; i < len; i++) {
            var toMem = thisGrp._callToMembers[i];
            thisGrp.setCallToMember(toMem.name, toMem.method);
        }
        return true;
    }
    return false;
}

var obj = {
    create: function (name) {
        var newObj = Object.create(this);
        if (this.hasOwnProperty('parentNames')) {
            newObj.parentNames = [];
            var len = this.parentNames.length;
            for (var i = 0; i < len; i++) {
                newObj.parentNames.push(this.parentNames[i]);
            }
        }

        if (this.hasOwnProperty('name')) {
            if (!newObj.hasOwnProperty('parentNames'))
                newObj.parentNames = [];
            newObj.parentNames.push(this.name);

            if (!name) {
                name = this.name; //name from originate during instance
            }
        }

        newObj.name = name;

        return newObj;
    },
    extend: function () {
        for (var i = 0; i < arguments.length; i++) {
            var extObj = arguments[i];
            for (var key in extObj)
                this[key] = extObj[key];
        }
        return this;
    },
    command: function () {
        var self = this;
        return function (cmd, opt) {
            if (typeof self[cmd] === 'function') {
                if (window.LOG) {
                    var result = self[cmd](opt);
                    if (!(reservedAttr(cmd))) {
                        LOG(TAG, self.name + ' -> ' + cmd, opt, result);
                    }
                    return result;
                } else {
                    return self[cmd](opt);
                }
            } else {
                if (window.LOG) {
                    var result = self[cmd];
                    if (!(reservedAttr(cmd))) {
                        LOG(TAG, self.name + '.' + cmd, '', result);
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
            this._memberList = {};
        } else if (!this.hasOwnProperty('_memberList')) { //inherited group
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
        var memberCmd;
        if (memberName in this._memberList) {
            memberCmd = this._memberList[memberName];
            if (window.LOG) {
                var result = memberCmd(methodName, opt);
                LOG(TAG, this.name + ' => ' + memberName, opt, result);
                return result;
            } else {
                return memberCmd(methodName, opt);
            }
        } else {
            var prototypeMemberList = this._memberList;
            for (var key in prototypeMemberList) {
                var memberCmd = prototypeMemberList[key];
                if (typeof memberCmd === 'function') {
                    var member = prototypeMemberList[key]('thisObj');
                    if (member.hasOwnProperty('parentNames')) {
                        var parentNames = member.parentNames;
                        var p_len = parentNames.length;
                        for (var j = 0; j < p_len; j++) {
                            if (memberName === parentNames[j]) {
                                if (window.LOG) {
                                    var result = memberCmd(methodName, opt);
                                    LOG(TAG, this.name + ' => ' + memberName, opt, result);
                                } else {
                                    memberCmd(methodName, opt); //no return till all members checked
                                }
                            }
                        }
                    }
                }
            }
        }
        //if not found, should we leave error?
    },

    /* call through to specific member whom play as a major role*/
    setCallToMember: function (memberName, methodName) {
        var that = this;
        var member = this.call(memberName, 'thisObj');
        if (member) {
            if (!this._callToMembers)
                this._callToMembers = [];
            this._callToMembers.push({
                name: memberName,
                method: methodName
            });

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
                        return _getMember(memberObj);
                    }
                }
            }
            return null;
        }
    },

    override: function (newMember, memberMap) {
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
