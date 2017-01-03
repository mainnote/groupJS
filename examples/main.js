//------------
//testing......
//------------
//button
var button = Grp.group.create('button');
button.extend({
    render: function() {
        return this.call('buttonDom', 'render');
    },
});


var buttonDom = Grp.obj.create('buttonDom');
buttonDom.extend({
    render: function() {
        var body = document.getElementsByTagName('body')[0];
        var elem = document.createElement('button');
        var textnode = document.createTextNode('I am a button');
        elem.appendChild(textnode);
        body.appendChild(elem);
        var opt = { elem: elem };
        this.group.call('buttonEvent', 'setClick', opt);
    },
});

var buttonEvent = Grp.obj.create('buttonEvent');
buttonEvent.extend({
    setClick: function(opt){
        var self = this;
        var elem = opt.elem;
        elem.addEventListener('click', clickEvent);
        function clickEvent(e) {
            var opt = { button: this };
            self.click(opt);
        }
    },
    click: function(opt) {
        alert('You clicked a button.');
    },
});

button.join(buttonDom, buttonEvent);

//form
var form = Grp.group.create('form');
form.extend({
    render: function(opt) {
        this.call('formDom', 'render', opt);
    },
});

var formDom = Grp.obj.create('formDom');
formDom.extend({
    render: function(opt) {
        var button_dom = this.group.call('formButton', 'render', opt);
        var div_container = document.createElement('div');
        div_container.id = opt.id;
        var input = document.createElement('input');
        div_container.appendChild(input);
        div_container.appendChild(button_dom);


        var body = document.getElementsByTagName('body')[0];
        body.appendChild(div_container);
    },
});

var formEvent = Grp.obj.create('formEvent');
formEvent.extend({
    clickRespond: function(opt) {
        var errorElem = opt.container.getElementsByClassName('error')[0];
        if (!errorElem) {
                errorElem = document.createElement('div');
                errorElem.className = 'error';
                opt.container.insertBefore(errorElem, opt.container.childNodes[0]);

        }

        if (this.group.call('formValidation', 'validation', opt)) {
            errorElem.innerHTML = '';
            var div_comments = document.createElement('div');
            var textnode = document.createTextNode(opt.inputValue);
            div_comments.appendChild(textnode);

            opt.container.appendChild(div_comments);
        } else {
            errorElem.innerHTML = 'Wrong Input!';
        }
    },
});

var formButton = button.create('formButton'); //sub-group
var formButtonDom = buttonDom.create('buttonDom'); //override the member buttonDom as key buttonDom
formButtonDom.extend({
    render: function(opt) {
        var elem = document.createElement('button');
        var textnode = document.createTextNode('I am a form button');
        elem.appendChild(textnode);
        var opt0 = { elem: elem };
        this.group.call('buttonEvent', 'setClick', opt0);
        return elem;
    },
});
formButton.join(formButtonDom); //override the member buttonDom as key buttonDom

var formButtonEvent = buttonEvent.create('buttonEvent'); //override
formButtonEvent.extend({
    click: function(opt) {
        var container = opt.button.parentElement;
        var val = container.getElementsByTagName('input')[0].value;
        var formGroup = this.group.group;
        opt.inputValue = val;
        opt.container = container;
        return this.group.group.call('formEvent', 'clickRespond', opt); //parent group called
    },
});
formButton.join(formButtonEvent);

var formValidation = Grp.obj.create('formValidation');
formValidation.extend({
    validation: function(opt) {
        return /^[a-zA-Z0-9]+$/i.test(opt.inputValue);
    },
});

form.join(formDom, formEvent, formValidation, formButton); //sub-group

//-----------------
//instantiates
//-----------------
var newBtn = button.create('newBtn');
newBtn.render();

var newForm = form.create('newForm');
var opt1 = { id: 'firstForm' };
newForm.render(opt1);

var newForm2 = newForm.create('newForm2');
var opt2 = { id: 'secondForm' };
newForm2.render(opt2);

var newForm3 = form.create('newForm3');
var opt3 = { id: 'thirdForm' };
newForm3.render(opt3);
