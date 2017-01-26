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

        var child1 = parent.create('child1');
        var child2 = parent.create('child2');

        child1.setA({
            a: 1
        });
        child2.setA({
            a: 2
        });
        expect(child1.getA('')[0] + 1).toEqual(child2.getA()[0]);

        child1.setB({
            key: 'x',
            value: 99
        });
        child2.setB({
            key: 'y',
            value: 99
        });
        expect(child1.getB()['y']).toBeUndefined();
        expect(child2.getB()['x']).toBeUndefined();
    });


    it("test method super", function () {
        var Parent = Grp.obj.create('Parent');
        Parent.extend({
            init: function () {
                this.a = 'yes';
            },
            getA: function(){
              return this.a;
            }
        });

        var parentCmd = Parent.create('parentCmd');

        var child1 = Parent.create('child1');
        child1.extend({
            init: function () {
                Parent.init.call(this);
                this.b = 'no';
            }
        });
        expect(child1.getA()).toEqual(parentCmd.getA());

        var grandChild1 = child1.create('grandChild1');
        grandChild1.extend({
            init: function () {
                child1.init.call(this);
                this.c = 'cool';
            }
        });
        expect(grandChild1.getA()).toEqual(parentCmd.getA());

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

    it("test method override", function(){
        var a0 = Grp.obj.create('a0');
        a0.extend({
            speak: function() {
                return 'a0';
            },
        });

        var g0 = Grp.group.create('g0');
        g0.extend({
            run: function(){
                return this.call('a0', 'speak');
            }
        });
        g0.join(a0);

        expect(g0.run()).toEqual('a0');

        a01 = Grp.obj.create('a0');
        a01.extend({
            speak: function(){
                return 'a01';
            },
        });
        g0.override(a01);
        expect(g0.run()).toEqual('a01');

    });
});
