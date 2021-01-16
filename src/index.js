"use strict";

/** set environment variables */
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../env/.env') });

const Logger = require('../lib/Logger');

const snews = require('./sites/sneakernews');
const solec = require('./sites/solecollector');

snews.run = async () => {
    try {
        /** scrape all sneakernews pages (10 x 2) and wait for them to finish */
        const arrs = await Promise.all(snews.init());

        /** flatten the results of deployed scrapers */
        const data = [].concat(...arrs);
    } catch (e) {
        Logger.log('error', 'Data Error: %s', e);
    }
}

solec.run = async () => {
    try {
        /** scrape all solecollector endpoints and wait for them to finish */
        const arrs = await Promise.all(await solec.init());

        /** flatten the results of deployed scrapers */
        const data = [].concat(...arrs);

        console.log(data);
    } catch (e) {
        Logger.log('error', 'Data Error: %s', e);
    }
}

//snews.run();
solec.run();