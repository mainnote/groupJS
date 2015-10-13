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
        
        childrenGrp.setCallToMember('child', 'smile');
        expect(childrenGrpCmd('smile')).toEqual('smiling');
	});

});
