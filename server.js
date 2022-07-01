const PORT = 1389
const BIND_PASSWORD = "supersecret"
const BASE_DN = "dc=baraddur, dc=mordor"
//const BIND_THINGY = "cn=sauron"+", "+BASE_DN
const BIND_THINGY = "cn=sauron"
const PHONEBOOK_THINGY = "ou=Phonebook" + ", " + BASE_DN
const DEV = true

const ldap = require('ldapjs');
const ldapServer = ldap.createServer();

ldapServer.bind(BIND_THINGY, (request, result, next) => {
    console.log("Binding to " + request.dn + " with credentials=" + request.credentials + "...")

    // "So the entries cn=root and cn=evil, cn=root would both match and flow into this handler. Hence that check."
    if (request.dn.toString() !== BIND_THINGY || request.credentials !== BIND_PASSWORD) {
        console.log("Credentials check failed")
        return next(new ldap.InvalidCredentialsError());
    } else {
        console.log("Credentials check passed")
        result.end();
        return next();
    }
});

function authorize(request, result, next) {
    console.log("Authorizing " + request.connection.ldap.bindDN + "...")

    if (!request.connection.ldap.bindDN.equals(BIND_THINGY)) {
        console.log("Authorization check failed")
        return next(new ldap.InsufficientAccessRightsError());
    } else {
        console.log("Authorization check passed")
        return next();
    }
}

function getUsers() {
    console.log("Getting mock users...")

    const users = [
        {username: "sauron", phonenumber: "1"},
        {username: "saruman", phonenumber: "666"},
        {username: "wario", phonenumber: "111"},
    ];

    return users;
}

/**
 * Loads all mock users into the request object.
 * A real implementation should probably not load everything.
 */
function loadMockUsers(request, result, next) {
    console.log("Loading mock users...")

    request.users = {};

    for (const user of getUsers()) {
        const dn = 'cn=' + user.username + ',' + PHONEBOOK_THINGY
        console.log("Adding user " + user.username + " as " + dn + "...")

        // Mitel docs suggest schema inetOrgPerson: https://www.manualslib.de/manual/74859/Aastra-Opencom-X320.html?page=228#manual
        // Defined like in https://www.msxfaq.de/windows/inetorgorgperson.htm
        // Some more information in OIP docs: https://productdocuments.mitel.com/doc_finder/DocFinder/syd-0431_de.pdf?get&DNR=syd-0431?get&DNR=syd-0431
        request.users[user.username] = {
            dn: dn,
            attributes: {
                cn: user.username,
                givenName: user.username,
                displayName: user.username + " " + user.username,
                name: user.username + " " + user.username,
                // TODO: phone numbers should be E.123
                homePhone: user.phonenumber, // TODO
                mobile: user.phonenumber, // TODO
                // objectClass must always be present in LDAP. Clients break otherwise.
                objectClass:
                    [
                        "Top",
                        "person",
                        "organizationalPerson",
                        "user",
                        "inetOrgPerson",
                    ]
            }
        };
    }

    return next();
}

/**
 * Loads all users into the request object.
 */
function loadUsers(request, result, next) {
    console.log("Loading users...")

    if (DEV) {
        loadMockUsers(request, result, next);
    } else {

    }

    return next();
}

const pre = [authorize, loadUsers];

// NOTE: We could also use e.g. "ou=Phonebook,dc=baraddur,dc=mordor" as "name" parameter.
//       This would register this handler only for this tree. But we can also just basically ignore it.
//ldapServer.search(PHONEBOOK_THINGY, pre, (request, result, next) => {
ldapServer.search("", pre, (request, result, next) => {
    console.log("Processing search request...")
    console.log('  Base object (DN): ' + request.dn.toString());
    console.log('  Scope: ' + request.scope);
    console.log('  Filter: ' + request.filter.toString());

    const keys = Object.keys(request.users);
    for (const k of keys) {
        //console.log("Checking whether user "+k+" matches...")
        if (request.filter.matches(request.users[k].attributes)) {
            console.log("Adding object to results: " + k)
            result.send(request.users[k]);
        }
    }

    result.end();
    return next();
});

ldapServer.unbind((request, result, next) => {
    console.log("Unbinding...")
    // We could do some clean up here or close handles, if needed.
    result.end();
});

ldapServer.listen(PORT, function () {
    console.log('LDAP listening at ' + ldapServer.url);
});