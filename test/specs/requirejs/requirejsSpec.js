define(function (require) {
    describe('Setup', function () {
        it('group module is available.', function () {
          expect(typeof require('group') === 'object').toBe(true);
          expect(typeof require('group').obj === 'object').toBe(true);
          expect(typeof require('group').group === 'object').toBe(true);
        });
    });
});