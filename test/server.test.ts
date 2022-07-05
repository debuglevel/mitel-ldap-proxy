const server = require('../server');

describe("nothing", () => {
    it("always passing", () => {
        expect(true).toBe(true);
    });
});

describe("extractNumber", () => {
    it("extracts number from simple OR filter", () => {
        expect(server.extractNumber("(|(mobile=+4930666)(homephone=+4930666)(telephonenumber=+4930666))"))
            .toBe("+4930666");
    });

    it("extracts number from nested OR filter", () => {
        expect(server.extractNumber("(|(|(mobile=+4930666)(homephone=+4930666))(telephonenumber=+4930666))"))
            .toBe("+4930666");
    });
});

describe("extractName", () => {
    it("extracts name from simple OR filter", () => {
        expect(server.extractName("(sn=Sauron*)"))
            .toBe("Sauron");
    });

    it("extracts name from unnecessarily nested OR filter", () => {
        expect(server.extractName("(|(sn=Sauron*))"))
            .toBe("Sauron");
    });
});