import {Person} from "./person";
import {Backend} from "./backend";

const logger = require("./logger");

export class DummyBackend implements Backend {
    async searchByNumber(number: string): Promise<Person[]> {
        logger.debug("Searching persons for number '" + number + "'");

        const persons = this.getPersons();

        const matchingPersons: Person[] = [];
        for (const person of persons) {
            logger.trace("Checking if person '" + person.displayname + "' number matches '" + number + "'...");

            const numbers = [];
            numbers.push(...person.home);
            numbers.push(...person.mobile);
            numbers.push(...person.business);

            if (numbers.some(x => x === number)) {
                logger.trace("Adding matching person '" + person.displayname + "'...");
                matchingPersons.push(person);
            }
        }

        logger.trace("Searched persons for number '" + number + "': " + matchingPersons.length);
        return matchingPersons;
    }

    async searchByNames(givenname: string, surname: string): Promise<Person[]> {
        // TODO: might be broken due to change in (name) to (givenname,surname) prototype
        logger.debug("Searching persons for name '" + surname + "'");

        const persons = this.getPersons();

        const matchingPersons = [];
        for (const person of persons) {
            logger.trace("Checking if person '" + person.displayname + "' name matches '" + surname + "'...");
            if (person.givenname.startsWith(givenname) || person.surname.startsWith(surname)) {
                logger.trace("Adding matching person '" + person.displayname + "'...");
                matchingPersons.push(person);
            }
        }

        logger.trace("Searched persons for name '" + surname + "': " + matchingPersons.length);
        return matchingPersons;
    }

    private getPersons(): Person[] {
        logger.trace("Getting persons...");

        const persons: Person[] = [
            new Person(1, "Sauron", "Bad-Guy", ["+4910011"], ["+4910021", "+4910022", "+4910022"], ["+4910031", "+4910032"]),
            new Person(2, "Saruman", "the White", ["+4920"], ["+4921"], ["+4922"]),
            new Person(3, "Tom", "Riddle", ["+4930"], ["+4931"], ["+4932"])
        ];

        return persons;
    }
}
