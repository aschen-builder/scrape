"use strict";

/**
 * solecollector.js
 * @module
 * @description scrape releases from https://solecollector.com/
 */

/** required libraries */
const cheerio = require('cheerio');
const axios = require('axios');
const Logger = require('../../lib/Logger');

/** required model(s) */
const Sneaker = require('../../lib/Sneaker');

/**
 * getBrands
 * @param {Object} agent 
 * @param {Array<string>} brands 
 */
async function getBrands(agent, brands) {
    Logger.log('info', 'Attempting to GET %s  =>  { point: /brands, query: get=99 }', agent.defaults.baseURL);

    try {
        const res = await agent.get('/brands?get=99');
        const data = res.data.filter(e => brands.includes(e.alias)).map(e => {
            return {
                parent_id: e.id,
                name: e.name,
                alias: e.alias,
                created_at: e.date_created,
                updated_at: e.date_updated,
                items: e.releases_count
            }
        });

        Logger.log('info', 'Successfully retrieved GET %s  =>  { point: /brands, query: get=99 }', agent.defaults.baseURL);

        return data;
    } catch (e) {
        Logger.log('error', 'Page Scraping Error: %s', e);
    }
}

/**
 * createSneakerCollection
 * @method
 * @param {Array<Object>} data array of sneaker JSON data
 * @returns {Array<Object>}
 */
function createSneakerCollection(data) {
    return data.map(sneaker => {
        return createSneaker(sneaker);
    });
}

/**
 * createSneaker
 * @method
 * @param {Object} data sneaker JSON data
 * @returns {Object} Sneaker instance
 */
function createSneaker(data) {
    
}

/**
 * scrape
 * @param {Object} agent 
 * @param {Object} brand 
 */
async function scrape(agent, brand) {
    const now = Date.now();

    try {
        const res = await agent.get(`/releases?parent_id=${brand.parent_id}&get=${brand.items}`);

        const data = res.data.filter(e => now < (new Date(e.release_date)).getTime());

        const sneakers = createSneakerCollection(data);

        return data;
    } catch (e) {
        Logger.log('error', 'ERROR %s => Page Scraping Error: %s', `/releases?parent_id=${brand.id}&get=${brand.items}`, e);
    }
}

/**
 * init
 * @method
 */
exports.init = async () => {
    /** create new axios instance and set config */
    const fetch = axios.create({
        baseURL: `https://solecollector.com/api/sneaker-api/`,
        timeout: 6000, // long ass timeout bc solecollector is slow
        headers: {
            'User-Agent': require('../../lib/UserAgents.json')[801]
        }
    });

    /** brand names to filter /brands? endpoint by */
    const brands = [
        'nike',
        'jordan',
        'adidas',
        'reebok',
        'vans',
        'puma',
        'converse',
        'new balance'
    ];

    /** store scraping Promises */
    const Promises = [];

    try {
        const data = await getBrands(fetch, brands);

        data.forEach(brand => Promises.push(scrape(fetch, brand)));
    } catch (e) {
        Logger.log('error', 'Page Scraping Error: %s', e);
    }

    return Promises;
}