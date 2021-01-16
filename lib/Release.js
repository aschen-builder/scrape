"use strict";

const { encode } = require('./Utils');

/**
 * Release
 * @class
 * 
 * Parent class for all types of releases, used
 * as a model for updating release database.
 */
class Release {
    id;
    name;
    type;
    tags;
    source;
    created_at;
    updated_at;
    product;


    /** @constructor */
    constructor(name, type, source, data, tags = []) {
        const date = Date.now();

        this.id = encode(name);
        this.name = name;
        this.type = type;
        this.source = source;
        this.product = data;
        this.tags = tags;

        this.created_at = date;
        this.updated_at = date;
    }
}

module.exports = Release;