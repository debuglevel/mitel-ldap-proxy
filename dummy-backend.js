const searchByNumber = function (number) {
    console.log("Searching users for number '" + number + "'");

    const users = getUsers();

    let matchingUsers = [];
    users.forEach(function (user, index) {
        console.log("Checking if user '" + user.displayname + "' number matches '" + number + "'...");

        const numbers = [];
        numbers.push(...user.home);
        numbers.push(...user.mobile);
        numbers.push(...user.business);

        if (numbers.some(x => x === number)) {
            console.log("Adding matching user '" + user.displayname + "'...");
            matchingUsers.push(user);
        }
    });

    console.log("Searched users for number '" + number + "': " + matchingUsers.length);
    return matchingUsers;
}

const searchByName = function (name) {
    console.log("Searching users for name '" + name + "'");

    const users = getUsers();

    let matchingUsers = [];
    users.forEach(function (user, index) {
        console.log("Checking if user '" + user.displayname + "' name matches '" + name + "'...")
        if (user.givenname.startsWith(name) || user.surname.startsWith(name)) {
            console.log("Adding matching user '" + user.displayname + "'...")
            matchingUsers.push(user);
        }
    });

    console.log("Searched users for name '" + name + "': " + matchingUsers.length);
    return matchingUsers;
}

function getUsers() {
    console.log("Getting users...")

    const users = [
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

    for (const user of users) {
        user.displayname = user.surname + ", " + user.givenname;
    }

    return users;
}

module.exports = {
    searchByNumber,
    searchByName,
};