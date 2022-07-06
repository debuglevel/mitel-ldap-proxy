export class Person {
    id: number;
    givenname: string;
    surname: string;
    home: string[] = [];
    mobile: string[] = [];
    business: string[] = [];

    constructor(
        id: number,
        givenname: string,
        surname: string,
        home: string[],
        mobile: string[],
        business: string[],
    ) {
        this.id = id;
        this.givenname = givenname;
        this.surname = surname;

        // Clone given array, as it would be a reference otherwise.
        // TODO: Maybe that would be okay?
        this.home = [...home];
        this.mobile = [...mobile];
        this.business = [...business];
    }

    get displayname(): string {
        return `${this.surname}, ${this.givenname}`;
    }
}