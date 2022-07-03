import {Person} from "./person";

interface Backend {
    searchByNumber(number: number): Promise<Person[]>

    searchByName(name: string): Promise<Person[]>
}