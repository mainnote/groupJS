describe("Test suite for module in global scope", function () {
    it("check if module available", function () {
        expect(typeof Grp === 'object').toBe(true);
    });

    it("object inheritance of Animal case", function () {
        var Animal = Grp.obj.create('Animal');
        Animal.extend({
            speak: function (opt) {
                return opt.message;
            },
            food: 0,
        });

        var Ant = Animal.create('Ant');
        Ant.extend({
            speak: function (opt) {
                opt.message = 'I am an ant, ' + opt.message;
                return Animal.speak.call(this, opt);
            },
            foundFood: function (opt) {
                this.food = this.food + opt.food;
            },
        });

        var opt = {
            message: 'my friend',
            food: 1
        };
        var ant = Ant.create('ant');
        var ant2 = Ant.create('ant2');

        expect(ant.speak(opt) === 'I am an ant, my friend').toBe(true);
        expect(ant.food === 0).toBe(true);
        ant.foundFood(opt);
        expect(ant.food === 0).toBe(false);
        expect(ant.food === Ant.food).toBe(false);
        expect(ant.food === ant2.food).toBe(false);
    });

    it("group object of Bus case", function () {
        var Bus = Grp.group.create('Bus');
        Bus.extend({
            run: function (opt) {
                this.call('Driver', 'startEngine');
            },
            stop: function (opt) {
                this.call('Driver', 'stopEngine');
            },
            getEngineFlag: function (opt) {
                return this.call('Engine', 'getFlag');
            },
            inform: function (opt) {
                this.call('Driver', 'informPassengers', opt);
            },
            noOfPassenger: function (opt) {
                var count = 0;
                var opt_ = {
                    addCount: function () {
                        count++;
                    },
                };
                this.call('Passenger', 'getStatus', opt_);
                return count;
            },
        });

        var Engine = Grp.obj.create('Engine');
        Engine.extend({
            flag: false,
            start: function (opt) {
                this.flag = true;
            },
            stop: function (opt) {
                this.flag = false;
            },
            getFlag: function(){
              return this.flag;
            }
        });

        var Driver = Grp.obj.create('Driver');
        Driver.extend({
            startEngine: function (opt) {
                this.group.call('Engine', 'start');
            },
            stopEngine: function (opt) {
                this.group.call('Engine', 'stop');
            },
            informPassengers: function (opt) {
                return this.group.call('Passenger', 'listen', opt); //passagers instances call
            },
        });

        var Passenger = Grp.obj.create('Passenger');
        Passenger.extend({
            offStation: '',
            status: 'on',
            listen: function (opt) {
                if (this.offStation === opt.station)
                    this.setStatus({
                        status: 'off'
                    });
            },
            setStatus: function (opt) {
                this.status = opt.status;
            },
            getStatus: function (opt) {
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

        var cityBus = Bus.create('cityBus');
        cityBus.run();
        expect(cityBus.getEngineFlag()).toBe(true);
        cityBus.stop();
        expect(cityBus.getEngineFlag()).toBe(false);

        //this is test invalid because we don't want to call all sharing _id to be excuted!!!!!
        /*
        cityBus.inform({
            station: 'main street'
        });
        expect(cityBus.noOfPassenger()).toEqual(1);
        cityBus.inform({
            station: '100 St.'
        });
        expect(cityBus.noOfPassenger()).toEqual(0);
        */
    });

    it("sub group of IT Company case", function () {
        var Employee = Grp.obj.create('Employee');
        var BA = Employee.create('BA');
        BA.extend({
            designProduct: function (opt) {
                return true;
            },
            verifyProduct: function (opt) {
                return true;
            },
        });
        var Dev = Employee.create('Dev');
        Dev.extend({
            createProduct: function (opt) {
                return true;
            },
        });

        var Tester = Employee.create('Tester');
        Tester.extend({
            testProduct: function (opt) {
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
            requestNewProduct: function (opt) {
                return this.group.call('DevTeam', 'makeProduct');
            },
        });
        DevTeam.extend({
            makeProduct: function (opt) {
                if (this.call('BA', 'designProduct') && this.call('Dev', 'createProduct')) { //ask member
                    var opt_ = {
                        product: 'Edge'
                    };
                    return this.group.call('TestTeam', 'testProduct', opt_); //ask parent group
                }
            },
        });
        TestTeam.extend({
            testProduct: function (opt) {
                if (this.call('Tester', 'testProduct') && this.call('BA', 'verifyProduct')) {
                    return opt.product;
                }
            },
        });
        ITCompany.extend({
            releaseNewProduct: function (opt) {
                return this.call('CEO', 'requestNewProduct');
            },
        });
        ITCompany.join(DevTeam, TestTeam, CEO);

        var microsoft = ITCompany.create('microsoft');
        expect(microsoft.releaseNewProduct()).toEqual('Edge');
    });

    it("test setCallToMember", function () {
        var child = Grp.obj.create('child');
        child.extend({
            toy: 'video game',
            play: function (opt) {
                return this.toy;
            },
        });
        var childrenGrp = Grp.group.create('childrenGrp');
        childrenGrp.join(child);
        childrenGrp.setCallToMember('child');

        childrenGrpCmd = childrenGrp.create('childrenGrpCmd');
        expect(childrenGrpCmd.play()).toEqual('video game');

        child.extend({
            smile: function () {
                return 'smiling';
            },
        });

        //you have to manually reset it since we don't know what group it had been join.
        //another option is to use override child with new child.
        childrenGrp.setCallToMember('child', 'smile');
        expect(childrenGrpCmd.smile()).toEqual('smiling');

        var dog = Grp.obj.create('dog');
        dog.extend({
            bark: function () {
                return 'barking';
            },
        });
        childrenGrp.join(dog);
        childrenGrp.setCallToMember(dog);
        expect(childrenGrpCmd.bark()).toEqual('barking');

        var childMbr = childrenGrp.getMember('child');

        childMbr.extend({
            smile: function () {
                return 'haha';
            },
        });
        expect(childrenGrpCmd.smile()).toEqual('haha');

        //when childrenGrp instantial again, it will point to a new dog member
        var memberA = Grp.obj.create('memberA');
        memberA.extend({
            total: 0,
            bark: function () {
                return ++this.total;
            }
        });
        var groupA = Grp.group.create('groupA');
        groupA.join(memberA);
        groupA.setCallToMember('memberA');
        var GA1 = groupA.create('GA1');
        var GA2 = groupA.create('GA2');
        var GA3 = groupA.create('GA3');
        expect(GA1.bark()).toEqual(1);
        expect(GA2.bark()).toEqual(1);
        expect(GA3.bark()).toEqual(1);
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
            say: function () {
                return 'I am b2';
            },
        });
        var g1 = Grp.group.create('g1');
        g1.join(b0, b1, b2, g0);
        g1.setCallToMember('b2');
        g1.extend({
            sayg1: function () {},
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
            sing: function (opt) {
                return 'music';
            }
        });
        g2.join(c0, c1, c2, g1, g11);
        g2.setCallToMember('g1');

        var members = g2.members();
        expect(members[3].members[3].members[0].name).toEqual('a0');

        var xx = Grp.obj.create('b2');
        xx.extend({
            say: function () {
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
                "name": "g1",
                "members": [{
                        "name": "g0",
                        "members": [{
                                "name": "a0"
							}
						]
					}
				]
			},
		];
        var yy = Grp.obj.create('a0');
        yy.extend({
            yell: function () {
                return 'yeah!';
            },
        });
        g2.override(yy, map);
        expect(g2.call('g1', 'thisObj').call('g0', 'thisObj').call('a0', 'thisObj').yell()).toEqual('yeah!');

        var newC1 = g2.getMember('c1').create();
        newC1.extend({
            ask: function (opt) {
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

    it("test method init", function () {
        var parent = Grp.obj.create('parent');
        parent.extend({
            init: function () {
                this.a = [];
                this.b = {};
            },

            setA: function (opt) {
                this.a.push(opt.a);
            },
            setB: function (opt) {
                this.b[opt.key] = opt.value;
            },
            getA: function (opt) {
                return this.a;
            },
            getB: function (opt) {
                return this.b;
            }
        });

        var child1Cmd = parent.create('child1').command();
        var child2Cmd = parent.create('child2').command();

        child1Cmd('setA', {
            a: 1
        });
        child2Cmd('setA', {
            a: 2
        });
        expect(child1Cmd('getA')[0] + 1).toEqual(child2Cmd('getA')[0]);

        child1Cmd('setB', {
            key: 'x',
            value: 99
        });
        child2Cmd('setB', {
            key: 'y',
            value: 99
        });
        expect(child1Cmd('getB')['y']).toBeUndefined();
        expect(child2Cmd('getB')['x']).toBeUndefined();
    });


    it("test method super", function () {
        var Parent = Grp.obj.create('Parent');
        //console.log('Parent created');
        Parent.extend({
            init: function () {
                //console.log('Parent.init for ' + this.name);
                this.a = 'yes';
            }
        });
        //console.log('Parent extend');

        var parentCmd = Parent.create('parentCmd').command();
        //console.log('parentCmd created');

        var child1 = Parent.create('child1');
        //console.log('child1 created');
        child1.extend({
            init: function () {
                //console.log('child1.init for ' + this.name);
                Parent.init.call(this);
                this.b = 'no';
            }
        });
        //console.log('child1 extend');

        var child1Cmd = child1.command();

        expect(child1Cmd('a')).toEqual(parentCmd('a'));

        var grandChild1 = child1.create('grandChild1');
        //console.log('grandChild1 created');
        grandChild1.extend({
            init: function () {
                //console.log('grandChild1.init for ' + this.name);
                child1.init.call(this);
                this.c = 'cool';
            }
        });
        //console.log('grandChild1 extend');
        var grandChild1Cmd = grandChild1.command();
        expect(grandChild1Cmd('a')).toEqual(parentCmd('a'));

    }); //it



    it("test method upCall", function () {
        var m1 = Grp.obj.create('m1');
        m1.extend({
            findM5: function (opt) {
                return this.group.upCall('m5', 'showMe', {
                    value: 1
                });
            }
        });
        var m2 = Grp.obj.create('m2');
        var gA = Grp.group.create('gA');
        gA.join(m1, m2);

        var m3 = Grp.obj.create('m3');
        var m4 = Grp.obj.create('m4');
        var gB = Grp.group.create('gB');
        gB.join(m3, m4, gA);

        var m5 = Grp.obj.create('m5');
        m5.extend({
            showMe: function (opt) {
                return opt.value + 10;
            }
        });
        var m6 = Grp.obj.create('m6');
        var gC = Grp.group.create('gC');
        gC.extend({
            callM1: function (opt) {
                return this.downCall('m1', 'findM5');
            }
        });
        gC.join(m5, m6, gB);

        expect(gC.callM1()).toEqual(11);

    }); //it



    it("test method call return last inherited member result", function () {
        var m1 = Grp.obj.create('m1');
        var n1 = m1.create('n1');
        n1.extend({
            show: function (opt) {
                return 'n1';
            },
            showN1: function (opt) {
                return 'n1';
            },
        });
        var n2 = m1.create('n2');
        n2.extend({
            show: function (opt) {
                return 'n2';
            }
        });
        var gA = Grp.group.create('gA');
        gA.join(n1, n2);
        var ga = gA.create('ga');

        expect(ga.call('m1', 'show')).toEqual('n2');
        expect(ga.call('m1', 'showN1')).toEqual('n1');

    }); //it
});
