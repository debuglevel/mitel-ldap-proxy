module.exports = {
    buildUser: buildObject,
};

function buildObject(user) {
    console.log("Building LDAP object for user '" + user.displayname + "'...")

    const dn = 'CN="' + user.displayname + '"'
    console.log("Adding user '" + user.displayname + "' as " + dn + "...")

    // Mitel docs suggest schema inetOrgPerson: https://www.manualslib.de/manual/74859/Aastra-Opencom-X320.html?page=228#manual
    // Defined like in https://www.msxfaq.de/windows/inetorgorgperson.htm
    // Some more information in OIP docs: https://productdocuments.mitel.com/doc_finder/DocFinder/syd-0431_de.pdf?get&DNR=syd-0431?get&DNR=syd-0431
    return {
        dn: dn, // TODO: or objectName?
        attributes: {
            sn: user.surname,
            givenname: user.givenname,
            // TODO: phone numbers should be E.123
            telephonenumber: user.business,
            homephone: user.home,
            mobile: user.mobile,
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