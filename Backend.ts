import {Person} from "./person";

export interface Backend {
    searchByNumber(number: string): Promise<Person[]>

    searchByName(name: string): Promise<Person[]>
}