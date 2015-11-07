describe("Test suite for module in global scope", function () {
	it("check if module available", function () {
		expect(typeof Grp === 'object').toBe(true);
	});

	it("object inheritance of Animal case", function () {
		var Animal = Grp.obj.create('Animal');
		Animal.extend({
			speak : function (opt) {
				return opt.message;
			},
			food : 0,
		});

		var Ant = Animal.create('Ant');
		Ant.extend({
			speak : function (opt) {
				opt.message = 'I am an ant, ' + opt.message;
				return Animal.speak.call(this, opt);
			},
			foundFood : function (opt) {
				this.food = this.food + opt.food;
			},
		});

		var opt = {
			message : 'my friend',
			food : 1
		};
		var ant = Ant.create('ant').command();
		var ant2 = Ant.create('ant2').command();

		expect(ant('speak', opt) === 'I am an ant, my friend').toBe(true);
		expect(ant('food') === 0).toBe(true);
		ant('foundFood', opt);
		expect(ant('food') === 0).toBe(false);
		expect(ant('food') === Ant.command()('food')).toBe(false);
		expect(ant('food') === ant2('food')).toBe(false);
		expect(typeof ant('parentNames') === 'object').toBe(true);
	});

	it("group object of Bus case", function () {
		var Bus = Grp.group.create('Bus');
		Bus.extend({
			run : function (opt) {
				this.call('Driver', 'startEngine');
			},
			stop : function (opt) {
				this.call('Driver', 'stopEngine');
			},
			getEngineFlag : function (opt) {
				return this.call('Engine', 'flag');
			},
			inform : function (opt) {
				this.call('Driver', 'informPassengers', opt);
			},
			noOfPassenger : function (opt) {
				var count = 0;
				var opt_ = {
					addCount : function () {
						count++;
					},
				};
				this.call('Passenger', 'getStatus', opt_);
				return count;
			},
		});

		var Engine = Grp.obj.create('Engine');
		Engine.extend({
			flag : false,
			start : function (opt) {
				this.flag = true;
			},
			stop : function (opt) {
				this.flag = false;
			},
		});

		var Driver = Grp.obj.create('Driver');
		Driver.extend({
			startEngine : function (opt) {
				this.group.call('Engine', 'start');
			},
			stopEngine : function (opt) {
				this.group.call('Engine', 'stop');
			},
			informPassengers : function (opt) {
				return this.group.call('Passenger', 'listen', opt); //passagers instances call
			},
		});

		var Passenger = Grp.obj.create('Passenger');
		Passenger.extend({
			offStation : '',
			status : 'on',
			listen : function (opt) {
				if (this.offStation === opt.station)
					this.setStatus({
						status : 'off'
					});
			},
			setStatus : function (opt) {
				this.status = opt.status;
			},
			getStatus : function (opt) {
				if (this.status === 'on') {
					opt.addCount();
				}
			},
		});

		var John = Passenger.create('John');
		John.offStation = 'main street';
		var Tom = Passenger.create('Tom');
		Tom.offStation = '100 St.';

		Bus.join(Engine, Driver, John, Tom);

		var cityBusCmd = Bus.create('cityBus').command();
		cityBusCmd('run');
		expect(cityBusCmd('getEngineFlag')).toBe(true);
		cityBusCmd('stop');
		expect(cityBusCmd('getEngineFlag')).toBe(false);
		cityBusCmd('inform', {
			station : 'main street'
		});
		expect(cityBusCmd('noOfPassenger')).toEqual(1);
		cityBusCmd('inform', {
			station : '100 St.'
		});
		expect(cityBusCmd('noOfPassenger')).toEqual(0);
	});

	it("sub group of IT Company case", function () {
		var Employee = Grp.obj.create('Employee');
		var BA = Employee.create('BA');
		BA.extend({
			designProduct : function (opt) {
				return true;
			},
			verifyProduct : function (opt) {
				return true;
			},
		});
		var Dev = Employee.create('Dev');
		Dev.extend({
			createProduct : function (opt) {
				return true;
			},
		});

		var Tester = Employee.create('Tester');
		Tester.extend({
			testProduct : function (opt) {
				return true;
			},
		});

		var Team = Grp.group.create('Team');
		var DevTeam = Team.create('DevTeam');

		var TestTeam = Team.create('TestTeam');
		DevTeam.join(BA, Dev);
		TestTeam.join(Tester, BA);

		var Company = Grp.group.create('Company');
		var ITCompany = Company.create('ITCompany');
		var CEO = Employee.create('CEO');
		CEO.extend({
			requestNewProduct : function (opt) {
				return this.group.call('DevTeam', 'makeProduct');
			},
		});
		DevTeam.extend({
			makeProduct : function (opt) {
				if (this.call('BA', 'designProduct') && this.call('Dev', 'createProduct')) { //ask member
					var opt_ = {
						product : 'Edge'
					};
					return this.group.call('TestTeam', 'testProduct', opt_); //ask parent group
				}
			},
		});
		TestTeam.extend({
			testProduct : function (opt) {
				if (this.call('Tester', 'testProduct') && this.call('BA', 'verifyProduct')) {
					return opt.product;
				}
			},
		});
		ITCompany.extend({
			releaseNewProduct : function (opt) {
				return this.call('CEO', 'requestNewProduct');
			},
		});
		ITCompany.join(DevTeam, TestTeam, CEO);

		var microsoft = ITCompany.create('microsoft').command();
		expect(microsoft('releaseNewProduct')).toEqual('Edge');
	});

	it("test setCallToMember", function () {
		var child = Grp.obj.create('child');
		child.extend({
			toy : 'video game',
			play : function (opt) {
				return this.toy;
			},
		});
		var childrenGrp = Grp.group.create('childrenGrp');
		childrenGrp.join(child);
		childrenGrp.setCallToMember('child');

		childrenGrpCmd = childrenGrp.create('childrenGrpCmd').command();
		expect(childrenGrpCmd('play')).toEqual('video game');

		child.extend({
			smile : function () {
				return 'smiling';
			},
		});

		//you have to manually reset it since we don't know what group it had been join.
		//another option is to use override child with new child.
		childrenGrp.setCallToMember('child', 'smile');
		expect(childrenGrpCmd('smile')).toEqual('smiling');

		var dog = Grp.obj.create('dog');
		dog.extend({
			bark : function () {
				return 'barking';
			},
		});
		childrenGrp.join(dog);
		childrenGrp.setCallToMember('dog');
		expect(childrenGrpCmd('bark')).toEqual('barking');
        
        var childMbr = childrenGrp.getMember('child').create();

		childMbr.extend({
			smile : function () {
				return 'haha';
			},
		});
        childrenGrp.override(childMbr);
        expect(childrenGrpCmd('smile')).toEqual('haha');
	});

	it("test multi level groups", function () {
		var a0 = Grp.obj.create('a0');
		var a1 = Grp.obj.create('a1');
		var a2 = Grp.obj.create('a2');
		var g0 = Grp.group.create('g0');
		g0.join(a0, a1, a2);

		var b0 = Grp.obj.create('b0');
		var b1 = Grp.obj.create('b1');
		var b2 = Grp.obj.create('b2');
		b2.extend({
			say : function () {
				return 'I am b2';
			},
		});
		var g1 = Grp.group.create('g1');
		g1.join(b0, b1, b2, g0);
		g1.setCallToMember('b2');
		g1.extend({
			sayg1 : function () {},
		});

		var b01 = Grp.obj.create('b01');
		var b11 = Grp.obj.create('b11');
		var b21 = Grp.obj.create('b21');
		var g11 = Grp.group.create('g11');
		g11.join(b01, b11, b21, b2);

		var c0 = Grp.obj.create('c0');
		var c1 = Grp.obj.create('c1');
		var c2 = Grp.obj.create('c2');
		var g2 = Grp.group.create('g2');
        
        c1.extend({
            sing: function(opt){
                return 'music';
            }
        });
		g2.join(c0, c1, c2, g1, g11);
		g2.setCallToMember('g1');

		var members = g2.members();
		expect(members[3].members[3].members[0].name).toEqual('a0');

		var xx = Grp.obj.create('b2');
		xx.extend({
			say : function () {
				return 'hi';
			},
		});
		g2.override(xx);
		//console.log('members', JSON.stringify(g2.members()));
		expect(g2.command()('say')).toEqual('hi');
		expect(g2.say()).toEqual('hi');
		expect(g2.call('g1', 'thisObj').call('b2', 'thisObj').say()).toEqual('hi');
		expect(g2.call('g11', 'thisObj').call('b2', 'thisObj').say()).toEqual('hi');

		var map = [{
				"name" : "g1",
				"members" : [{
						"name" : "g0",
						"members" : [{
								"name" : "a0"
							}
						]
					}
				]
			},
		];
		var yy = Grp.obj.create('a0');
		yy.extend({
			yell : function () {
				return 'yeah!';
			},
		});
		g2.override(yy, map);
		expect(g2.call('g1', 'thisObj').call('g0', 'thisObj').call('a0', 'thisObj').yell()).toEqual('yeah!');
        
        var newC1 = g2.getMember('c1').create();
        newC1.extend({
            ask: function(opt){
                return this.sing();
            },
        })
        g2.override(newC1);
        expect(g2.call('c1', 'ask')).toEqual('music');
        
        var newA0 = g2.getMember('a0', map).create();
        expect(newA0.yell()).toEqual('yeah!');
        expect(g2.getMember('x99')).toEqual(null);
        expect(g2.getMember('b2').name).toEqual('b2');
        
        /*
        console.log(JSON.stringify(g2.members()));
        [{"name":"c0"},{"name":"c1"},{"name":"c2"},{"name":"g1","members":[{"name":"b0"},{"name":"b1"},{"name":"b2"},{"name":"g0","members":[{"name":"a0"},{"name":"a1"},{"name":"a2"}]}]},{"name":"g11","members":[{"name":"b01"},{"name":"b11"},{"name":"b21"},{"name":"b2"}]}] */
        
	});
});
