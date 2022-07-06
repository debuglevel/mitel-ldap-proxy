import {Person} from "./person";
import {MysqlBackend} from "./mysql-backend";
import {DummyBackend} from "./dummy-backend";
import {Backend} from "./backend";

const logger = require("./logger");
logger.info("Starting mitel-ldap-proxy...");

const ldapUtils = require("./ldap-utils");

const ldap = require("ldapjs");

// We retrieve default values from .env
// That might not be best practise because it seems often to be present in ignore-files.
logger.debug("Loading configuration...");
require("dotenv").config();
logger.debug(process.env);

initializeBackend().then(result => {
    const backend = result;

    const ldapServer = ldap.createServer();

    ldapServer.bind(process.env.BIND_THINGY, (request: any, result: any, next: any) => {
        logger.debug(`Binding to ${request.dn}...`);

        // "So the entries cn=root and cn=evil, cn=root would both match and flow into this handler. Hence that check."
        if (request.dn.toString() !== process.env.BIND_THINGY || request.credentials !== process.env.BIND_PASSWORD) {
            logger.warn("Credentials check failed");
            return next(new ldap.InvalidCredentialsError());
        } else {
            logger.trace("Credentials check passed");
            result.end();
            return next();
        }
    });

    // NOTE: We could also use e.g. "ou=Phonebook,dc=baraddur,dc=mordor" as "name" parameter.
    //       This would register this handler only for this tree. But we can also just basically ignore it.
    //ldapServer.search(PHONEBOOK_THINGY, pre, (request, result, next) => {
    ldapServer.search("", [authorize], (request: any, result: any, next: any) => {
        try {
            logger.debug("Processing search request...");
            logger.trace(`  Base object (DN): ${request.dn.toString()}`);
            logger.trace(`  Scope: ${request.scope}`);
            logger.trace(`  Filter: ${request.filter.toString()}`);
            // logger.trace(request.filter)

            const searchType = ldapUtils.getSearchType(request.filter.toString());
            logger.trace(`Search type: ${searchType}`);

            if (searchType === "byName") {
                const name = ldapUtils.extractName(request.filter.toString());
                backend.searchByName(name)
                    .then((persons: Person[]) => {
                        for (const person of persons) {
                            const ldapPerson = ldapUtils.buildObject(person);

                            logger.trace(`Sending LDAP person...: ${ldapPerson}`);
                            result.send(ldapPerson);
                        }

                        result.end();
                        return next();
                    });
            } else if (searchType === "byNumber") {
                const number = ldapUtils.extractNumber(request.filter.filters[1].toString());

                backend.searchByNumber(number)
                    .then((persons: Person[]) => {
                        for (const person of persons) {
                            const ldapPerson = ldapUtils.buildObject(person);

                            logger.trace(`Sending LDAP person...: ${ldapPerson}`);
                            result.send(ldapPerson);
                        }

                        result.end();
                        return next();
                    });
            }else if (searchType === "all") {
                backend.searchByName("")
                    .then((persons: Person[]) => {
                        for (const person of persons) {
                            const ldapPerson = ldapUtils.buildObject(person);

                            logger.trace(`Sending LDAP person...: ${ldapPerson}`);
                            result.send(ldapPerson);
                        }

                        result.end();
                        return next();
                    });
            }
        } catch (e) {
            logger.error(e);
        }
    });

    ldapServer.unbind((request: any, result: any, next: any) => {
        logger.debug("Unbinding...");
        // We could do some clean up here or close handles, if needed.
        result.end();
    });

    ldapServer.listen(process.env.PORT, function () {
        logger.info(`LDAP listening at ${ldapServer.url}`);
    });
});

function authorize(request: any, result: any, next: any) {
    logger.debug(`Authorizing ${request.connection.ldap.bindDN}...`);

    if (!request.connection.ldap.bindDN.equals(process.env.BIND_THINGY)) {
        logger.warn("Authorization check failed");
        return next(new ldap.InsufficientAccessRightsError());
    } else {
        logger.trace("Authorization check passed");
        return next();
    }
}

async function initializeBackend(): Promise<Backend> {
    logger.debug("Initializing backend...");

    const isDev = (process.env.DEV === "true");
    logger.trace(`Using development environment: ${isDev}`);
    if (isDev) {
        logger.trace("Initializing dummy backend...");
        const dummyBackend = new DummyBackend();
        return dummyBackend;
    } else {
        logger.trace("Initializing MySQL backend...");
        const mysqlBackend = new MysqlBackend();
        await mysqlBackend.initialize();
        return mysqlBackend;
    }
}
