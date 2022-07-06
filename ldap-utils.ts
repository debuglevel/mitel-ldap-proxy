const logger = require("./logger");

module.exports = {
    buildObject,
    extractNames,
    extractSurname,
    extractGivenname,
    extractNumber,
    getSearchType,
};

import {Person} from "./person";

function buildObject(person: Person) {
    logger.trace(`Building LDAP object for person '${person.displayname}'...`);

    const dn = `CN="${person.id}"`;
    logger.trace(`Adding person '${person.displayname}' as ${dn}...`);

    // Mitel docs suggest schema inetOrgPerson: https://www.manualslib.de/manual/74859/Aastra-Opencom-X320.html?page=228#manual
    // Defined like in https://www.msxfaq.de/windows/inetorgorgperson.htm
    // Some more information in OIP docs: https://productdocuments.mitel.com/doc_finder/DocFinder/syd-0431_de.pdf?get&DNR=syd-0431?get&DNR=syd-0431
    const ldapPerson = {
        dn: dn,
        attributes: {
            cn: person.id,
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

    logger.trace(`Built LDAP object for person '${person.displayname}': ${ldapPerson}`);
    return ldapPerson;
}

function getSearchType(filter: string): string | undefined {
    logger.trace(`Getting search type for filter '${filter}'...`);

    let searchType: string | undefined;
    if (filter.toLowerCase().includes("(sn=")
        || filter.toLowerCase().includes("(givenname=")) {
        searchType = "byName";
    } else if (
        filter.toLowerCase().includes("(mobile=")
        || filter.toLowerCase().includes("(homephone=")
        || filter.toLowerCase().includes("(telephonenumber=")) {
        searchType = "byNumber";
    } else if (filter.toLocaleLowerCase() === "(objectclass=*)") {
        searchType = "all";
    } else {
        logger.error("ERROR: Filter is neither 'byName' nor 'byNumber' nor 'all'!");
        searchType = undefined;
    }

    logger.trace(`Got search type for filter '${filter}': ${searchType}`);
    return searchType;
}

function extractNumber(filter: string): string {
    logger.trace(`Extracting number from filter ${filter}...`);
    const regExp = RegExp("\\(.*=(.*?)\\)"); // The ? in .*? is for un-greedy.
    const regExpExecArray = regExp.exec(filter);

    if (regExpExecArray === null) {
        throw Error(`Could not extract number from filter ${filter}`);
    } else {
        const number = regExpExecArray[1];

        logger.trace(`Extracted number from filter ${filter}: ${number}`);
        return number;
    }
}

function extractNames(filter: string): object {
    logger.trace(`Extracting names from filter ${filter}...`);

    let givenname: String | null = null;
    try {
        givenname = extractGivenname(filter);
    }catch(e){ }

    let surname: String | null = null;
    try {
        surname = extractSurname(filter);
    }catch(e){ }

    if (givenname === null && surname === null) {
        throw Error(`Could not extract names from filter ${filter}`);
    } else {
        return { 
            givenname: givenname,
            surname: surname,
        };
    }
}

function extractGivenname(filter: string): string {
    logger.trace(`Extracting givenname from filter ${filter}...`);
    const regExp = RegExp("\\(given[nN]ame=(.*?)\\*?\\)"); // The ? in .*? is for un-greedy.
    const regExpExecArray = regExp.exec(filter);

    if (regExpExecArray === null) {
        throw Error(`Could not extract givenname from filter ${filter}`);
    } else {
        const name = regExpExecArray[1];

        logger.trace(`Extracted givenname from filter ${filter}: ${name}`);
        return name;
    }
}

function extractSurname(filter: string): string {
    logger.trace(`Extracting surname from filter ${filter}...`);
    const regExp = RegExp("\\(sn=(.*?)\\*?\\)"); // The ? in .*? is for un-greedy.
    const regExpExecArray = regExp.exec(filter);

    if (regExpExecArray === null) {
        throw Error(`Could not extract surname from filter ${filter}`);
    } else {
        const name = regExpExecArray[1];

        logger.trace(`Extracted surname from filter ${filter}: ${name}`);
        return name;
    }
}