import {Person} from "./person";

export interface Backend {
    searchByNumber(number: string): Promise<Person[]>

    searchByNames(givenname: string, surname: string): Promise<Person[]>
}