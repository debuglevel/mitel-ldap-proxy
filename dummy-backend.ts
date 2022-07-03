import {Person} from "./person";
import {Backend} from "./Backend";

export class DummyBackend implements Backend {
    async searchByNumber(number: string): Promise<Person[]> {
        console.log("Searching persons for number '" + number + "'");

        const persons = this.getPersons();

        let matchingPersons: Person[] = [];
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

    async searchByName(name: string): Promise<Person[]> {
        console.log("Searching persons for name '" + name + "'");

        const persons = this.getPersons();

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

    private getPersons(): Person[] {
        console.log("Getting persons...")

        const persons: Person[] = [
            new Person("Sauron", "Bad-Guy", ["+4910011"], ["+4910021", "+4910022", "+4910022"], ["+4910031", "+4910032"]),
            new Person("Saruman", "the White", ["+4920"], ["+4921"], ["+4922"]),
            new Person("Tom", "Riddle", ["+4930"], ["+4931"], ["+4932"])
        ];

        return persons;
    }
}
