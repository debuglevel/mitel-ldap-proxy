module.exports = {
    buildPerson: buildObject,
};

function buildObject(person) {
    console.log("Building LDAP object for person '" + person.displayname + "'...")

    const dn = 'CN="' + person.displayname + '"'
    console.log("Adding person '" + person.displayname + "' as " + dn + "...")

    // Mitel docs suggest schema inetOrgPerson: https://www.manualslib.de/manual/74859/Aastra-Opencom-X320.html?page=228#manual
    // Defined like in https://www.msxfaq.de/windows/inetorgorgperson.htm
    // Some more information in OIP docs: https://productdocuments.mitel.com/doc_finder/DocFinder/syd-0431_de.pdf?get&DNR=syd-0431?get&DNR=syd-0431
    return {
        dn: dn, // TODO: or objectName?
        attributes: {
            sn: person.surname,
            givenname: person.givenname,
            // TODO: phone numbers should be E.123
            telephonenumber: person.business,
            homephone: person.home,
            mobile: person.mobile,
            // objectClass must always be present in LDAP. Clients break otherwise.
            // Unknown which or any of these would actually be needed by PBX.
            objectClass:
                [
                    "Top",
                    "person",
                    "organizationalPerson",
                    "user",
                    "inetOrgPerson",
                ],
        },
    };
}