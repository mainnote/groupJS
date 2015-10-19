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
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP && oThis
                 ? this
                 : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}
//----------------------------

var obj = {
	create : function (name) {
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
	extend : function () {
		for (var i = 0; i < arguments.length; i++) {
			var extObj = arguments[i];
			for (var key in extObj)
				this[key] = extObj[key];
		}
	},
	command : function () {
		var self = this;
		return function (cmd, opt) {
			if (typeof self[cmd] === 'function') {
				return self[cmd](opt);
			} else {
				return self[cmd]; //value
			}
		};
	},
	thisObj : function () {
		return this;
	},
};

var group = obj.create('group');
group.extend({
	create : function (name) {
		var newObj = obj.create.apply(this, arguments);
		//all members should recreated within new group
		newObj._buildMemberList();

		return newObj;
	},
	_buildMemberList : function () {
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
	join : function () {
		for (var i = 0; i < arguments.length; i++) {
			var member = arguments[i];
			//add new member in command interface
			var newMember = member.create(member.name);
			newMember.group = this;
			this._memberList[member.name] = newMember.command();
		}
	},
	call : function (memberName, methodName, opt) {
		var memberCmd;
		if (memberName in this._memberList) {
			memberCmd = this._memberList[memberName];
			return memberCmd(methodName, opt);
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
								memberCmd(methodName, opt); //no return till all members checked
							}
						}
					}
				}
			}
		}
	},
	/* call through to specific member whom play as a major role*/
	setCallToMember : function (memberName, methodName) {
        var that = this;
		var member = this.call(memberName, 'thisObj');
		if (methodName) {
			_setMethod(methodName, member); //override specific attribute. Even the one might exist.
		} else {
			for (var key in member) {
                if (!(key in group)) { //skip those attributes exist in group (not this!!!)
                    _setMethod(key, member);
                }
			}
		}

		function _setMethod(attribute, memberObj) {
			if (typeof memberObj[attribute] === 'function') {
				that[attribute] = memberObj[attribute].bind(memberObj);
			} else {
				that[attribute] = memberObj[attribute];
			}
		}
	},
});

var Grp = {
	obj : obj,
	group : group
};
