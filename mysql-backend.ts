module.exports = {
    searchByNumber,
    searchByName,
    initialize,
};

import {Connection, PoolConnection} from "mariadb";
import {Person} from "./person";

const homeNumberTypeValue = "home";
const mobileNumberTypeValue = "mobile";
const businessNumberTypeValue = "business";

const mariadb = require('mariadb');
const pool = mariadb.createPool({
    host: process.env.DATABASE_HOST,
    port: parseInt(process.env.DATABASE_PORT!),
    database: process.env.DATABASE_NAME,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    connectionLimit: 5
});

function createTable(connection: Connection, name: string, sql: string) {
    console.log("Creating table '" + name + "' if not existing...");
    connection.query(sql, function (err: any, result: any) {
        if (err) throw err;
        console.log(result);
        console.log("Created table " + name + " (or already existing)");
    });
}

function createTables(connection: Connection) {
    console.log("Creating tables if not existing...");

    const sqlCreatePersons = "CREATE TABLE IF NOT EXISTS persons (id INT PRIMARY KEY, givenname VARCHAR(255), surname VARCHAR(255))";
    createTable(connection, "persons", sqlCreatePersons)

    const sqlCreateNumbers = "CREATE TABLE IF NOT EXISTS numbers (id INT PRIMARY KEY, person_id INT, type VARCHAR(255), number VARCHAR(255))";
    createTable(connection, "numbers", sqlCreateNumbers)
}

async function initialize() {
    let connection: PoolConnection;
    try {
        connection = await pool.getConnection();
        console.log(`Got connection with id=${connection?.threadId}`);
        createTables(connection);
    } catch (e: unknown) {
        console.log(e);
    } finally {
        if (connection!) {
            await connection.release(); // release to pool
        }
    }
}

async function getNumbers(connection: Connection, personId: number, numberType: string): Promise<string[]> {
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

async function getPersonById(id: number): Promise<Person> {
    console.log(`Getting person by id=${id}...`);

    let connection: PoolConnection;
    try {
        connection = await pool.getConnection();

        const result = await connection.query(`
        SELECT p.id, p.givenname, p.surname
        FROM persons p
        WHERE p.id = ? 
        `, [id]);

        // console.log("Results:");
        // console.log(result);

        // TODO: we could only process the first entry to be a little bit more efficient.
        let persons: Person[] = [];
        for (const row of result) {
            console.log("Building person from row...:");
            console.log(row);

            const person = new Person(
                row.givenname,
                row.surname,
                await getNumbers(connection, id, homeNumberTypeValue),
                await getNumbers(connection, id, mobileNumberTypeValue),
                await getNumbers(connection, id, businessNumberTypeValue)
            )

            console.log(`Built person from row:`);
            console.log(person);

            persons.push(person);
        }

        if (persons.length >= 1) {
            const person: Person = persons[0];

            console.log(`Got person by id=${id}:`)
            console.log(person);
            return person;
        } else {
            throw new Error(`no person found with id=${id}`); // TODO: needs probably better error handling; 0 persons should be quite common
        }
    } catch (e: unknown) {
        // TODO: a bit odd, to catch, log and re-throw it
        console.log(e);
        throw e;
    } finally {
        if (connection!) {
            await connection.release(); // release to pool
        }
    }
}

async function searchByNumber(number: number): Promise<Person[]> {
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
        throw e;
    } finally {
        if (connection) {
            await connection.release(); // release to pool
        }
    }
}

async function searchByName(name: string): Promise<Person[]> {
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
        throw e;
    } finally {
        if (connection) {
            await connection.release(); // release to pool
        }
    }
}
