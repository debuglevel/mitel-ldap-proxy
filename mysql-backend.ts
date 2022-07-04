import {Backend} from "./backend";
import {Connection, PoolConnection} from "mariadb";
import {Person} from "./person";

export class MysqlBackend implements Backend {
    private mariadb = require('mariadb');

    private homeNumberTypeValue = "home";
    private mobileNumberTypeValue = "mobile";
    private businessNumberTypeValue = "business";

    private pool = this.mariadb.createPool({
        host: process.env.DATABASE_HOST,
        port: parseInt(process.env.DATABASE_PORT!),
        database: process.env.DATABASE_NAME,
        user: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASSWORD,
        connectionLimit: 5
    });

    async initialize() {
        let connection: PoolConnection;
        try {
            connection = await this.pool.getConnection();
            console.log(`Got connection with id=${connection?.threadId}`);
            this.createTables(connection);
        } catch (e: unknown) {
            console.log(e);
        } finally {
            if (connection!) {
                await connection.release(); // release to pool
            }
        }
    }

    async searchByNumber(number: string): Promise<Person[]> {
        console.log(`Searching by number '${number}'...`);

        let connection;
        try {
            connection = await this.pool.getConnection();
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
                const person = await this.getPersonById(row.id)
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

    async searchByName(name: string): Promise<Person[]> {
        console.log(`Searching by name '${name}'`);

        let connection;
        try {
            connection = await this.pool.getConnection();
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
                const person = await this.getPersonById(row.id)
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

    private createTable(connection: Connection, name: string, sql: string) {
        console.log(`Creating table '${name}' if not existing...`);
        connection.query(sql, function (err: any, result: any) {
            if (err) throw err;
            console.log(result);
            console.log(`Created table ${name} (or already existing)`);
        });
    }

    private createTables(connection: Connection) {
        console.log("Creating tables if not existing...");

        const sqlCreatePersons = `
        CREATE TABLE IF NOT EXISTS \`persons\` (
            \`id\` int(11) NOT NULL,
            \`givenname\` varchar(255) DEFAULT NULL,
            \`surname\` varchar(255) DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`id\` (\`id\`),
            FULLTEXT KEY \`givenname\` (\`givenname\`),
            FULLTEXT KEY \`surname\` (\`surname\`)
           ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        `;
        this.createTable(connection, "persons", sqlCreatePersons)

        const sqlCreateNumbers = `
        CREATE TABLE IF NOT EXISTS \`numbers\` (
            \`id\` int(11) NOT NULL,
            \`person_id\` int(11) DEFAULT NULL,
            \`type\` varchar(255) DEFAULT NULL,
            \`number\` varchar(255) DEFAULT NULL,
            PRIMARY KEY (\`id\`),
            KEY \`id\` (\`id\`),
            KEY \`person_id\` (\`person_id\`),
            KEY \`number\` (\`number\`),
            KEY \`type\` (\`type\`)
           ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
           `;
        this.createTable(connection, "numbers", sqlCreateNumbers)
    }

    private async getNumbers(connection: Connection, personId: number, numberType: string): Promise<string[]> {
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

    private async getPersonById(id: number): Promise<Person> {
        console.log(`Getting person by id=${id}...`);

        let connection: PoolConnection;
        try {
            connection = await this.pool.getConnection();

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
                    await this.getNumbers(connection, id, this.homeNumberTypeValue),
                    await this.getNumbers(connection, id, this.mobileNumberTypeValue),
                    await this.getNumbers(connection, id, this.businessNumberTypeValue)
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
}