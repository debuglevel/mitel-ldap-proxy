// We retrieve default values from .env
// That might not be best practise because it seems often to be present in ignore-files.
console.log("Loading configuration...")
require('dotenv').config();
console.log(process.env)

const ldap = require('ldapjs');
const ldapServer = ldap.createServer();

const dummyBackend = require('./dummy-backend');
const mysqlBackend = require('./mysql-backend');
const ldapUtils = require('./ldap-utils');

ldapServer.bind(process.env.BIND_THINGY, (request, result, next) => {
    console.log("Binding to " + request.dn + " with credentials=" + request.credentials + "...")

    // "So the entries cn=root and cn=evil, cn=root would both match and flow into this handler. Hence that check."
    if (request.dn.toString() !== process.env.BIND_THINGY || request.credentials !== process.env.BIND_PASSWORD) {
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

    if (!request.connection.ldap.bindDN.equals(process.env.BIND_THINGY)) {
        console.log("Authorization check failed")
        return next(new ldap.InsufficientAccessRightsError());
    } else {
        console.log("Authorization check passed")
        return next();
    }
}

function getBackend() {
    console.log("Getting backend...");

    const isDev = (process.env.DEV === 'true');
    if (isDev) {
        console.log("Using dummy backend...");
        return dummyBackend;
    } else {
        console.log("Using MySQL backend...");
        return mysqlBackend;
    }
}

function getSearchType(filter) {
    console.log("Getting search type for filter '" + filter + "'...");

    if (filter.startsWith("(sn=")) {
        return "byName";
    } else if (filter.startsWith("(|(|mobile=")) {
        return "byNumber";
    } else {
        console.log("ERROR: Filter is neither byName nor byNumber!");
    }
}

const pre = [authorize];

// NOTE: We could also use e.g. "ou=Phonebook,dc=baraddur,dc=mordor" as "name" parameter.
//       This would register this handler only for this tree. But we can also just basically ignore it.
//ldapServer.search(PHONEBOOK_THINGY, pre, (request, result, next) => {
ldapServer.search("", pre, (request, result, next) => {
    console.log("Processing search request...")
    console.log('  Base object (DN): ' + request.dn.toString());
    console.log('  Scope: ' + request.scope);
    console.log('  Filter: ' + request.filter.toString());

    const searchType = getSearchType(request.filter.toString());
    console.log("Search type: " + searchType);

    const backend = getBackend();

    console.log(request.filter)

    let users
    if (searchType === "byName") {
        users = backend.searchByName(request.filter.initial);
    } else if (searchType === "byNumber") {
        users = backend.searchByNumber();
    }

    users.forEach(function (user, index) {
        const ldapUser = ldapUtils.buildUser(user);
        result.send(ldapUser);
    });

    result.end();
    return next();
});

ldapServer.unbind((request, result, next) => {
    console.log("Unbinding...")
    // We could do some clean up here or close handles, if needed.
    result.end();
});

ldapServer.listen(process.env.PORT, function () {
    console.log('LDAP listening at ' + ldapServer.url);
});