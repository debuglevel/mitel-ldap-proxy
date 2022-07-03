const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 5
});

function createTable(connection, name, sql) {
    console.log("Creating table '" + name + "' if not existing...");
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result);
        console.log("Created table " + name + " (or already existing)");
    });
}

function createTables(connection) {
    console.log("Creating tables if not existing...");

    const sqlCreatePersons = "CREATE TABLE IF NOT EXISTS persons (id INT PRIMARY KEY, givenname VARCHAR(255), surname VARCHAR(255))";
    createTable(connection, "persons", sqlCreatePersons)

    const sqlCreateNumbers = "CREATE TABLE IF NOT EXISTS numbers (id INT PRIMARY KEY, person_id INT, type VARCHAR(255), number VARCHAR(255))";
    createTable(connection, "numbers", sqlCreateNumbers)
}

async function initialize() {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`Got connection with id=${connection.threadId}`);
        createTables(connection);
    } catch (e) {
        console.log(e);
    } finally {
        if (connection) {
            await connection.release(); // release to pool
        }
    }
}

async function getNumbers(connection, personId, numberType) {
    console.log(`Getting '${numberType}' numbers for person id=${personId}...`)
    const result = await connection.query(`
        SELECT n.id, n.type, n.number
        FROM numbers n
        WHERE n.person_id = ? AND n.type = ?
        `, [personId, numberType]);

    let numbers = [];
    for (const row of result) {
        numbers.push(row.number);
    }

    console.log(`Got ${numbers.length} '${numberType}' numbers for person id=${personId}...`)
    return numbers;
}

async function getPersonById(id) {
    console.log(`Getting person by id=${id}...`)

    let connection;
    try {
        connection = await pool.getConnection();

        const result = await connection.query(`
        SELECT p.id, p.givenname, p.surname
        FROM persons p
        WHERE p.id = ? 
        `, [id]);

        // console.log("Results:");
        // console.log(result);

        let persons = [];
        for (const row of result) {
            const index = result.indexOf(row);
            console.log("Building person from row...:");
            console.log(row);

            const person = {
                givenname: row.givenname,
                surname: row.surname,
                displayname: `${row.surname}, ${row.givenname}`,
                home: await getNumbers(connection, id, "home"), // TODO: change to actual numberType
                mobile: await getNumbers(connection, id, "mobile"), // TODO: change to actual numberType
                business: await getNumbers(connection, id, "business"), // TODO: change to actual numberType
            }
            console.log(`Built person from row:`);
            console.log(person);

            persons.push(person);
        }

        const person = persons.pop();
        console.log(`Got person by id=${id}:`)
        console.log(person);
        return person;
    } catch (e) {
        console.log(e);
    } finally {
        if (connection) {
            await connection.release(); // release to pool
        }
    }
}

async function searchByNumber(number) {
    console.log(`Searching by number '${number}'...`);

    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`Got connection with id=${connection.threadId}`);

        const result = await connection.query(`
        SELECT p.id
        FROM numbers n
        JOIN persons p ON n.person_id = p.id
        WHERE n.number = ? 
        `, [number]);

        // console.log("Results:");
        // console.log(result);

        let persons = [];
        for (const row of result) {
            const person = await getPersonById(row.id)
            persons.push(person);
        }

        console.log(`Got ${persons.length} persons searched by number:`)
        console.log(persons);
        return persons;
    } catch (e) {
        console.log(e);
    } finally {
        if (connection) {
            await connection.release(); // release to pool
        }
    }
}

async function searchByName(name) {
    console.log(`Searching by name '${name}'`);

    let connection;
    try {
        connection = await pool.getConnection();
        console.log(`Got connection with id=${connection.threadId}`);

        const result = await connection.query(`
        SELECT p.id
        FROM persons p
        WHERE p.givenname LIKE ? OR p.surname LIKE ? 
        `, [`${name}%`, `${name}%`]);

        // console.log("Results:");
        // console.log(result);

        let persons = [];
        for (const row of result) {
            const person = await getPersonById(row.id)
            persons.push(person);
        }

        console.log(`Got ${persons.length} persons searched by name:`)
        console.log(persons);
        return persons;
    } catch (e) {
        console.log(e);
    } finally {
        if (connection) {
            await connection.release(); // release to pool
        }
    }
}

module.exports = {
    searchByNumber,
    searchByName,
    initialize,
};