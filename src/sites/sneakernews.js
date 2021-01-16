"use strict";

/**
 * sneakernews.js
 * @module
 * @description scrape releases from https://sneakernews.com/
 */

/** required libraries */
const cheerio = require('cheerio');
const axios = require('axios');
const Logger = require('../../lib/Logger');

/** required model(s) */
const Sneaker = require('../../lib/Sneaker');

/** define and export public properties for site's module */
exports.maxPages = 10;

exports.categories = {
    jordans: {
        page: 'air-jordan-release-dates',
        category_name: 'jordan-release'
    },
    sneakers: {
        page: 'release-dates',
        category_name: 'sneaker-release'
    }
};

/**
 * formatDetails
 * @param {Array<string>} args array of deatils as string values
 * @returns {Object} Sneaker instance deatils-config object
 */
function formatDetails(args) {
    let obj = {};

    args.forEach(arg => {
        /** some details have a colon after the detail type rather than whitespace, corrected here */
        const str = arg.replace(':', ' ');
        
        /** split array and shift prop */
        let arr = str.split(' ');
        const prop = arr.shift().toLowerCase();
        const value = arr.join(' ');

        obj[prop] = value;
    });

    return obj;
}

/**
 * formatSchedules
 * @param {Array<string>} stores ordered array representing release stores
 * @param {Array<string>} times ordered array representing release times
 * @returns {Array<string>} array representing formatted release schedules
 */
function formatSchedule(stores, times) {
    let arr = [];

    for (let i = 0; i < stores.length; i++) {
        arr.push(`${stores[i]} - ${times[i]}`);
    }

    return arr
}

/**
 * getPage
 * @method
 * @param {Object} agent instance of a http request agent
 * @param {number} page page number
 * @param {string} category_name site specific category req param value
 * @returns {string} site release data
 */
async function getPage(agent, page, category_name) {
    agent.defaults.params = { 
        action: 'release_date_load_more',
        nextpage: page,
        category_name: category_name,
        start_from: '0'
    };

    Logger.log('info', 'Attempting to GET %s  =>  { category: %s, page: %s }', agent.defaults.baseURL, category_name, page);

    try {
        const res = await agent.get('/admin-ajax.php');
        
        Logger.log('info', 'Successfully retrieved GET %s  =>  { category: %s, page: %s }', agent.defaults.baseURL, category_name, page);

        return await res.data.toString();
    } catch (e) {
        Logger.log('warn', 'Page Scraping Error: %s', e);
    }
}

/** configurable selectors for release content on page */
const selectors = {
    item: 'div.releases-box > div.content-box',
    item_selectors: {
        release_date: 'span.release-date',
        release_time: 'div.sn_where_buy_box > span.notapi',
        name: 'h2 > a',
        price: 'span.release-price',
        details: 'div.post-data',
        purchase: 'div.sn_where_buy_box > a'
    }
}

/**
 * getData
 * @method
 * @param {Object} $ HTML DOM object
 * @returns {Object} raw release data
 */
function getData($) {
    let els = selectors.item_selectors;

    let data = [];

    $(selectors.item).toArray().forEach(node => {
        let obj = {};

        /** global match escape formatting */
        const regex = /\t|\n/g;

        /** data point exlcusions */
        const excl = [
            'release_time',
            'details',
            'purchase'
        ];

        for (const prop in els) {
            const el = $(els[prop], node);

            /** check for multi-point data */
            if (!excl.includes(prop)) {
                obj[prop] = el.text().replace(regex, '').trim();
            } else {
                obj[prop] = [];

                /** had to build two separate handlers for the multi-point data */
                if (prop === 'details') {
                    el.children().toArray().forEach(child => {
                        obj[prop].push($(child).text().trim());
                    });
                } else {
                    el.toArray().forEach(e => {
                        obj[prop].push($(e).text().trim());
                    });
                }
            }
        }

        data.push(obj);
    });

    return data;
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
    const details = formatDetails(data.details);
    const schedule = formatSchedule(data.purchase, data.release_time);

    const sneaker = new Sneaker(data.name, data.price.replace(' ', ''), data.release_date, details, schedule);

    return sneaker;
}

/**
 * scrape
 * @method
 * @param {Object} agent 
 * @param {number} page 
 * @param {string} category 
 */
async function scrape(agent, page, category) {
    try {
        const str = await getPage(agent, page, category);
                
        const data = getData(cheerio.load(str, null, false));

        return createSneakerCollection(data);
    } catch (e) {
        Logger.log('warn', 'Page Scraping Error: %s', e);
    }
}

/**
 * init
 * @method
 */
exports.init = () => {
    const Promises = [];

    for (const prop in this.categories) {
        /** create new axios instance and set config */
        const fetch = axios.create({
            baseURL: `https://sneakernews.com/wp-admin/`,
            timeout: 3000,
            headers: {
                'User-Agent': require('../../lib/UserAgents.json')[801]
            }
        });

        /** get max number of site pages and process page data */
        for (let i = 1; i <= this.maxPages; i++) {
            Promises.push(scrape(fetch, i, this.categories[prop].category_name));
        }
    }

    return Promises;
}