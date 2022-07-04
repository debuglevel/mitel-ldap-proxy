import {Person} from "./person";
import {MysqlBackend} from "./mysql-backend";
import {DummyBackend} from "./dummy-backend";
import {Backend} from "./backend";

const logger = require('./logger');
logger.info('Starting mitel-ldap-proxy...');

const ldapUtils = require('./ldap-utils');

const ldap = require('ldapjs');

// We retrieve default values from .env
// That might not be best practise because it seems often to be present in ignore-files.
console.log("Loading configuration...")
require('dotenv').config();
console.log(process.env)

initializeBackend().then(result => {
    let backend = result;

    let ldapServer = ldap.createServer();

    ldapServer.bind(process.env.BIND_THINGY, (request: any, result: any, next: any) => {
        console.log(`Binding to ${request.dn} with credentials=${request.credentials}...`)

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

    // NOTE: We could also use e.g. "ou=Phonebook,dc=baraddur,dc=mordor" as "name" parameter.
    //       This would register this handler only for this tree. But we can also just basically ignore it.
    //ldapServer.search(PHONEBOOK_THINGY, pre, (request, result, next) => {
    ldapServer.search("", [authorize], (request: any, result: any, next: any) => {
        try {
            console.log("Processing search request...")
            console.log(`  Base object (DN): ${request.dn.toString()}`);
            console.log(`  Scope: ${request.scope}`);
            console.log(`  Filter: ${request.filter.toString()}`);
            console.log(request.filter)

            const searchType = getSearchType(request.filter.toString());
            console.log(`Search type: ${searchType}`);

            if (searchType === "byName") {
                backend.searchByName(request.filter.initial)
                    .then((persons: Person[]) => {
                        for (const person of persons) {
                            const ldapPerson = ldapUtils.buildPerson(person);

                            console.log(`Sending LDAP person...: ${ldapPerson}`)
                            result.send(ldapPerson);
                        }

                        result.end();
                        return next();
                    });
            } else if (searchType === "byNumber") {
                const number = extractNumber(request.filter.filters[1].toString());

                backend.searchByNumber(number)
                    .then((persons: Person[]) => {
                        for (const person of persons) {
                            const ldapPerson = ldapUtils.buildPerson(person);

                            console.log(`Sending LDAP person...: ${ldapPerson}`)
                            result.send(ldapPerson);
                        }

                        result.end();
                        return next();
                    });
            }
        } catch (e) {
            console.log(e)
        }
    });

    ldapServer.unbind((request: any, result: any, next: any) => {
        console.log("Unbinding...")
        // We could do some clean up here or close handles, if needed.
        result.end();
    });

    ldapServer.listen(process.env.PORT, function () {
        console.log(`LDAP listening at ${ldapServer.url}`);
    });
})

function authorize(request: any, result: any, next: any) {
    console.log(`Authorizing ${request.connection.ldap.bindDN}...`)

    if (!request.connection.ldap.bindDN.equals(process.env.BIND_THINGY)) {
        console.log("Authorization check failed")
        return next(new ldap.InsufficientAccessRightsError());
    } else {
        console.log("Authorization check passed")
        return next();
    }
}

async function initializeBackend(): Promise<Backend> {
    console.log("Initializing backend...");

    const isDev = (process.env.DEV === 'true');
    console.log(`Using development environment: ${isDev}`)
    if (isDev) {
        console.log("Initializing dummy backend...");
        const dummyBackend = new DummyBackend();
        return dummyBackend;
    } else {
        console.log("Initializing MySQL backend...");
        const mysqlBackend = new MysqlBackend();
        await mysqlBackend.initialize();
        return mysqlBackend;
    }
}

function getSearchType(filter: string): string | undefined {
    console.log(`Getting search type for filter '${filter}'...`);

    let searchType: string | undefined;
    if (filter.startsWith("(sn=")) {
        searchType = "byName";
    } else if (filter.startsWith("(|(mobile=")) {
        searchType = "byNumber";
    } else {
        console.log("ERROR: Filter is neither byName nor byNumber!");
        searchType = undefined
    }

    console.log(`Got search type for filter '${filter}': ${searchType}`);
    return searchType;
}

function extractNumber(simpleFilter: string): string {
    console.log(`Extracting number from filter ${simpleFilter}...`)
    // TODO: Does not work here, but fine in Regex101.com
    // let rx = RegExp('\(.*=(.*)\)');
    // let arr = rx.exec(simpleFilter);
    // console.log(arr);
    // let number = arr[1];

    const number = simpleFilter.split("=")[1].split(")")[0];

    console.log(`Extracted number from filter ${simpleFilter}: ${number}`)
    return number;
}
