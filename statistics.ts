const logger = require("./logger");

export class Statistics {
    private missedByName: number = 0;
    private foundByName: number = 0;
    private missedByNumber: number = 0;
    private foundByNumber: number = 0;

    addByNameMiss() {
        this.missedByName++;
        logger.debug(`Logged byName miss | ${this.get(this.missedByName, this.foundByName)}`);
    }

    addByNameFound() {
        this.foundByName++;
        logger.debug(`Logged byName found | ${this.get(this.missedByName, this.foundByName)}`);
    }

    addByNumberMiss() {
        this.missedByNumber++;
        logger.debug(`Logged byNumber miss | ${this.get(this.missedByNumber, this.foundByNumber)}`);
    }

    addByNumberFound() {
        this.foundByNumber++;
        logger.debug(`Logged byNumber found | ${this.get(this.missedByNumber, this.foundByNumber)}`);
    }

    get(missed: number, found: number) {
        return `missed: ${missed} | found: ${found}`;
    }
}