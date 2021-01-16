"use strict";

/**
 * Sneaker
 * @class
 *
 * Parent class for all types of releases, used
 * as a model for updating release database.
 */
class Sneaker {
    name;
    price;
    size;
    color;
    style;
    region;
    release_date;
    release_schedule = [];

    /** @constructor */
    constructor(name, price, date = 'TBD', details = {}, schedule = []) {
        this.name = name;
        this.price = price;
        this.release_date = date;

        this.release_schedule = schedule;

        for (let prop in details) {
            if (prop === 'region') {
                this[prop] = details[prop].split(', ');
            } else {
                this[prop] = details[prop];
            }
        }

        return this;
    }
}

module.exports = Sneaker;