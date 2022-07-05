const server = require('../ldap-utils');

describe("extractNumber", () => {
    it("extracts number from simple OR-filter (i.e. actual OpenCom X320)", () => {
        // This is what OpenCom X320 actually sends
        expect(server.extractNumber("(|(mobile=+4930666)(homephone=+4930666)(telephonenumber=+4930666))"))
            .toBe("+4930666");
    });

    it("extracts number from nested OR-filter (i.e. Mitel Q&A)", () => {
        // This is what Mitel Q&A states
        expect(server.extractNumber("(|(|(mobile=+4930666)(homephone=+4930666))(telephonenumber=+4930666))"))
            .toBe("+4930666");
    });

    it("extracts number from a hypothetical telephonenumber-only filter", () => {
        expect(server.extractNumber("(telephonenumber=+4930666)"))
            .toBe("+4930666");
    });

    it("extracts number from a hypothetical homephone-only filter", () => {
        expect(server.extractNumber("(homephone=+4930666)"))
            .toBe("+4930666");
    });

    it("extracts number from a hypothetical mobile-only filter", () => {
        expect(server.extractNumber("(mobile=+4930666)"))
            .toBe("+4930666");
    });

    it("extracts number from a hypothetical mobile-OR-telephonenumber filter", () => {
        expect(server.extractNumber("(|(mobile=+4930666)(telephonenumber=+4930666))"))
            .toBe("+4930666");
    });
});

describe("extractName", () => {
    it("extracts name from filter (i.e. Mitel Q&A)", () => {
        // This is what Mitel Q&A states
        expect(server.extractName("(sn=Sauron*)"))
            .toBe("Sauron");
    });

    it("extracts name from unnecessarily nested OR-filter (i.e. actual OpenCom X320)", () => {
        // This is what OpenCom X320 actually sends
        expect(server.extractName("(|(sn=Sauron*))"))
            .toBe("Sauron");
    });

    it("extracts name from a hypothetical filter without asterisk", () => {
        expect(server.extractName("(sn=Sauron)"))
            .toBe("Sauron");
    });

    it("extracts name from a hypothetical givenname-filter", () => {
        expect(server.extractName("(givenname=Sauron*)"))
            .toBe("Sauron");
    });
});