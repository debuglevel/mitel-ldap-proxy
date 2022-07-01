const ldap = require('ldapjs');
const ldapServer = ldap.createServer();

ldapServer.search('dc=example', function (request, result, next) {
    console.log("Received request: " + request)
    console.log("Filter: " + request.filter)

    const obj = {
        dn: request.dn.toString(),
        attributes: {
            objectclass: ['organization', 'top'],
            o: 'example'
        }
    };

    if (request.filter.matches(obj.attributes)) {
        result.send(obj);
    }

    result.end();
});

ldapServer.listen(1389, function () {
    console.log('Listening at ' + ldapServer.url);
});