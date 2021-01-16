"use strict";

/**
 * Utils
 * @class
 */

class Utils {
    /**
     * encode
     * @param {string} str string to be base64 encoded
     */
    static encode(str) {
        return Buffer.from(str).toString('base64');
    }

    /**
     * decode
     * @param {string} b64 base64 string to be decoded
     */
    static decode(b64) {
        return Buffer.from(b64, 'base64').toString('ascii');
    }
}

module.exports = Utils;