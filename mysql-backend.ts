import {Backend} from "./backend";
import {Connection, PoolConnection} from "mariadb";
import {Person} from "./person";
import {Statistics} from "./statistics";

const logger = require("./logger");

const statistics = new Statistics();

export class MysqlBackend implements Backend {
    private mariadb = require("mariadb");

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
            logger.trace("Getting connection...");
            connection = await this.pool.getConnection();
            logger.trace(`Got connection with id=${connection?.threadId}`);
            this.createTables(connection);
        } catch (e: unknown) {
            logger.error(e);
        } finally {
            if (connection!) {
                await connection.release(); // release to pool
            }
        }
    }

    async searchByNumber(number: string): Promise<Person[]> {
        logger.debug(`Searching by number '${number}'...`);

        let connection;
        try {
            logger.trace("Getting connection...");
            connection = await this.pool.getConnection();
            logger.trace(`Got connection with id=${connection.threadId}`);

            logger.trace("Querying...");
            const result = await connection.query(`
        SELECT p.id
        FROM numbers n
        JOIN persons p ON n.person_id = p.id
        WHERE n.number = ? 
        `, [number]);
            logger.trace(`Got ${result.length} results`);
            // logger.trace(result);

            const persons: Person[] = [];
            for (const row of result) {
                const person = await this.getPersonById(row.id);
                persons.push(person);
            }

            logger.trace(`Got ${persons.length} persons searched by number:`);
            logger.trace(persons);

            if (persons.length >= 1) {
                statistics.addByNumberFound();
            } else {
                statistics.addByNumberMiss();
            }

            return persons;
        } catch (e) {
            logger.error(e);
            throw e;
        } finally {
            if (connection) {
                await connection.release(); // release to pool
            }
        }
    }

    async searchByName(name: string): Promise<Person[]> {
        logger.debug(`Searching by name '${name}'`);

        let connection;
        try {
            logger.trace("Getting connection...");
            connection = await this.pool.getConnection();
            logger.trace(`Got connection with id=${connection.threadId}`);

            logger.trace("Querying...");
            const result = await connection.query(`
        SELECT p.id
        FROM persons p
        WHERE p.givenname LIKE ? OR p.surname LIKE ? 
        `, [`${name}%`, `${name}%`]);
            logger.trace(`Got ${result.length} results`);
            // logger.trace(result);

            const persons: Person[] = [];
            for (const row of result) {
                const person = await this.getPersonById(row.id);
                persons.push(person);
            }

            logger.trace(`Got ${persons.length} persons searched by name:`);
            logger.trace(persons);

            if (persons.length >= 1) {
                statistics.addByNameFound();
            } else {
                statistics.addByNameMiss();
            }

            return persons;
        } catch (e) {
            logger.debug(e);
            throw e;
        } finally {
            if (connection) {
                await connection.release(); // release to pool
            }
        }
    }

    private createTable(connection: Connection, name: string, sql: string) {
        logger.debug(`Creating table '${name}' if not existing...`);
        connection.query(sql, function (err: any, result: any) {
            if (err) throw err;
            logger.debug(result);
            logger.debug(`Created table ${name} (or already existing)`);
        });
    }

    private createTables(connection: Connection) {
        logger.debug("Creating tables if not existing...");

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
        this.createTable(connection, "persons", sqlCreatePersons);

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
        this.createTable(connection, "numbers", sqlCreateNumbers);
    }

    private async getNumbers(connection: Connection, personId: number, numberType: string): Promise<string[]> {
        logger.debug(`Getting '${numberType}' numbers for person id=${personId}...`);
        const result = await connection.query(`
        SELECT n.id, n.type, n.number
        FROM numbers n
        WHERE n.person_id = ? AND n.type = ?
        `, [personId, numberType]);

        const numbers = [];
        for (const row of result) {
            numbers.push(row.number);
        }

        logger.trace(`Got ${numbers.length} '${numberType}' numbers for person id=${personId}...`);
        return numbers;
    }

    private async getPersonById(id: number): Promise<Person> {
        logger.debug(`Getting person by id=${id}...`);

        let connection: PoolConnection;
        try {
            logger.trace("Getting connection...");
            connection = await this.pool.getConnection();
            logger.trace(`Got connection with id=${connection.threadId}`);

            logger.trace("Querying...");
            const result = await connection.query(`
        SELECT p.id, p.givenname, p.surname
        FROM persons p
        WHERE p.id = ? 
        `, [id]);
            logger.trace(`Got ${result.length} results`);
            // logger.trace(result);

            // TODO: we could only process the first entry to be a little bit more efficient.
            const persons: Person[] = [];
            for (const row of result) {
                logger.trace("Building person from row...:");
                logger.trace(row);

                const person = new Person(
                    row.givenname,
                    row.surname,
                    await this.getNumbers(connection, id, this.homeNumberTypeValue),
                    await this.getNumbers(connection, id, this.mobileNumberTypeValue),
                    await this.getNumbers(connection, id, this.businessNumberTypeValue)
                );

                logger.trace("Built person from row:");
                logger.trace(person);

                persons.push(person);
            }

            if (persons.length >= 1) {
                const person: Person = persons[0];

                logger.trace(`Got person by id=${id}:`);
                logger.trace(person);
                return person;
            } else {
                throw new Error(`No person found with id=${id}`); // TODO: needs probably better error handling; 0 persons should be quite common
            }
        } catch (e: unknown) {
            // TODO: a bit odd, to catch, log and re-throw it
            logger.error(e);
            throw e;
        } finally {
            if (connection!) {
                await connection.release(); // release to pool
            }
        }
    }
}