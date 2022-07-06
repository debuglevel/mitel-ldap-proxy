const server = require("../ldap-utils");

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

    it("extracts number from a hypothetical homePhone-only filter", () => {
        expect(server.extractNumber("(homePhone=+4930666)"))
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
        expect(server.extractNames("(sn=Riddle*)"))
            .toStrictEqual({ givenname: null, surname: "Riddle" });
    });

    it("extracts name from unnecessarily nested OR-filter (i.e. actual OpenCom X320)", () => {
        // This is what OpenCom X320 actually sends
        expect(server.extractNames("(|(sn=Riddle*))"))
            .toStrictEqual({ givenname: null, surname: "Riddle" });
    });

    it("extracts name from a hypothetical filter without asterisk", () => {
        expect(server.extractNames("(sn=Riddle)"))
            .toStrictEqual({ givenname: null, surname: "Riddle" });
    });

    it("extracts name from a hypothetical givenname-filter", () => {
        expect(server.extractNames("(givenname=Tom*)"))
            .toStrictEqual({ givenname: "Tom", surname: null });
    });

    it("extracts name from a hypothetical givenName-filter", () => {
        expect(server.extractNames("(givenName=Tom*)"))
            .toStrictEqual({ givenname: "Tom", surname: null });
    });

    it("extracts names from filter", () => {
        // This is what Mitel 6869i actually sends (on second query in menu seöection)
        expect(server.extractNames("(|(givenname=Tom*)(sn=Riddle*))"))
            .toStrictEqual({ givenname: "Tom", surname: "Riddle"});
    });
});

describe("extractSurname", () => {
    it("extracts surname from (sn=Riddle*)", () => {
        expect(server.extractSurname("(sn=Riddle*)"))
            .toBe("Riddle");
    });

    it("extracts surname from (|(givenname=Tom*)(sn=Riddle*))", () => {
        // This is what Mitel 6869i actually sends (on second query in menu seöection)
        expect(server.extractSurname("(|(givenname=Tom*)(sn=Riddle*))"))
            .toBe("Riddle");
    });
});

describe("extractGivenname", () => {
    it("extracts givenname from (givenname=Tom*)", () => {
        expect(server.extractGivenname("(givenname=Tom*)"))
            .toBe("Tom");
    });

    it("extracts givenname from (|(givenname=Tom*)(sn=Riddle*))", () => {
        // This is what Mitel 6869i actually sends (on second query in menu seöection)
        expect(server.extractGivenname("(|(givenname=Tom*)(sn=Riddle*))"))
            .toBe("Tom");
    });
});

describe("getSearchType", () => {
    it("concludes all search (objectClass=*)", () => {
        expect(server.getSearchType("(objectClass=*)"))
            .toBe("all");
    });

    it("concludes all search (objectclass=*)", () => {
        expect(server.getSearchType("(objectclass=*)"))
            .toBe("all");
    });

    it("concludes byName search (i.e. Mitel Q&A)", () => {
        // This is what Mitel Q&A states
        expect(server.getSearchType("(sn=Sauron*)"))
            .toBe("byName");
    });

    it("concludes byName search from unnecessarily nested OR-filter (i.e. actual OpenCom X320)", () => {
        // This is what OpenCom X320 actually sends
        expect(server.getSearchType("(|(sn=Sauron*))"))
            .toBe("byName");
    });

    it("concludes byName search from a hypothetical filter without asterisk", () => {
        expect(server.getSearchType("(sn=Sauron)"))
            .toBe("byName");
    });

    it("concludes byName search from a hypothetical givenname-filter", () => {
        expect(server.getSearchType("(givenname=Sauron*)"))
            .toBe("byName");
    });

    it("concludes byName search from a hypothetical givenName-filter", () => {
        expect(server.getSearchType("(givenName=Sauron*)"))
            .toBe("byName");
    });

    it("concludes byNumber search from simple OR-filter (i.e. actual OpenCom X320)", () => {
        // This is what OpenCom X320 actually sends
        expect(server.getSearchType("(|(mobile=+4930666)(homephone=+4930666)(telephonenumber=+4930666))"))
            .toBe("byNumber");
    });

    it("concludes byNumber search from nested OR-filter (i.e. Mitel Q&A)", () => {
        // This is what Mitel Q&A states
        expect(server.getSearchType("(|(|(mobile=+4930666)(homephone=+4930666))(telephonenumber=+4930666))"))
            .toBe("byNumber");
    });


    it("concludes byNumber search from a hypothetical telephonenumber-only filter", () => {
        expect(server.getSearchType("(telephonenumber=+4930666)"))
            .toBe("byNumber");
    });

    it("concludes byNumber search from a hypothetical homephone-only filter", () => {
        expect(server.getSearchType("(homephone=+4930666)"))
            .toBe("byNumber");
    });

    it("concludes byNumber search from a hypothetical homePhone-only filter", () => {
        expect(server.getSearchType("(homePhone=+4930666)"))
            .toBe("byNumber");
    });

    it("concludes byNumber search from a hypothetical mobile-only filter", () => {
        expect(server.getSearchType("(mobile=+4930666)"))
            .toBe("byNumber");
    });

    it("concludes byNumber search from a hypothetical mobile-OR-telephonenumber filter", () => {
        expect(server.getSearchType("(|(mobile=+4930666)(telephonenumber=+4930666))"))
            .toBe("byNumber");
    });
});