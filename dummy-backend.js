const searchByNumber = function (number) {
    console.log("Searching persons for number '" + number + "'");

    const persons = getPersons();

    let matchingPersons = [];
    for (const person of persons) {
        console.log("Checking if person '" + person.displayname + "' number matches '" + number + "'...");

        const numbers = [];
        numbers.push(...person.home);
        numbers.push(...person.mobile);
        numbers.push(...person.business);

        if (numbers.some(x => x === number)) {
            console.log("Adding matching person '" + person.displayname + "'...");
            matchingPersons.push(person);
        }
    }

    console.log("Searched persons for number '" + number + "': " + matchingPersons.length);
    return matchingPersons;
}

const searchByName = function (name) {
    console.log("Searching persons for name '" + name + "'");

    const persons = getPersons();

    let matchingPersons = [];
    for (const person of persons) {
        console.log("Checking if person '" + person.displayname + "' name matches '" + name + "'...")
        if (person.givenname.startsWith(name) || person.surname.startsWith(name)) {
            console.log("Adding matching person '" + person.displayname + "'...")
            matchingPersons.push(person);
        }
    }

    console.log("Searched persons for name '" + name + "': " + matchingPersons.length);
    return matchingPersons;
}

function getPersons() {
    console.log("Getting persons...")

    const persons = [
        {
            givenname: "Sauron",
            surname: "Bad-Guy",
            home: ["+4910011"],
            mobile: ["+4910021", "+4910022", "+4910022"],
            business: ["+4910031", "+4910032"],
        },
        {
            givenname: "Saruman",
            surname: "the White",
            home: ["+4920"],
            mobile: ["+4921"],
            business: ["+4922"],
        },
        {
            givenname: "Tom",
            surname: "Riddle",
            home: ["+4930"],
            mobile: ["+4931"],
            business: ["+4932"],
        },
    ];

    for (const person of persons) {
        person.displayname = person.surname + ", " + person.givenname;
    }

    return persons;
}

module.exports = {
    searchByNumber,
    searchByName,
};