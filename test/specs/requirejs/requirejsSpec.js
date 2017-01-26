define(function(require) {
    describe('Setup', function() {
        it('group module is available.', function(done) {
            require(['group'], function(group) {
                expect(typeof group === 'object').toBe(true);
                expect(typeof group.obj === 'object').toBe(true);
                expect(typeof group.group === 'object').toBe(true);
                done();
            });
        });
    });
});
