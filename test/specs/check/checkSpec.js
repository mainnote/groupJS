console.log('hello world');
describe("Test suite for module in global scope", function () {
  it("check if module available", function () {
      console.log("check if module available")
      expect(1 === 1).toBe(true);
  });
});
