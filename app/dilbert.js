'use strict';

const rp = require('request-promise');
const xml2js = require('xml2js');
const js2xml = new xml2js.Builder({cdata: true});
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const mapSeries = require('promise-map-series');

let redis;

const keyExpire = 60 * 60 * 24 * 9;

/**
 *
 * @param {string} sourceUrl
 * @returns {Promise}
 */
function fetchImageUrl(sourceUrl) {
    return rp(sourceUrl)
        .then((result) => {
            const document = new Dom({ errorHandler: () => false })
                .parseFromString(result);
            const imgUrl = xpath.select('/html/head/meta[@property="og:image"]/@content', document);
            if (!imgUrl[0].value) {
                return false;
            }
            return imgUrl[0].value;
        });
}

/**
 * @param {string} body
 * @returns {Promise}
 */
function parseToXml(body) {
    return new Promise(function(resolve, reject) {
        try {
            xml2js.parseString(body, (error, result) => {
                if (error) {
                    return reject(error);
                }
                return resolve(result);
            });
        } catch (error) {
            return reject(error);
        }
    });
}

/**
 *
 * @param {string} key
 * @returns {Promise}
 */
function cacheGet(key) {
    return new Promise((resolve, reject) => {
        redis.get(key, (error, result) => {
            if (error) {
                return reject(error);
            }
            return resolve(result);
        });
    });
}
/**
 *
 * @param {string} key
 * @param {string} value
 * @returns {Promise}
 */
function cacheSet(key, value) {
    return new Promise((resolve, reject) => {
        redis.set(key, value, setError => {
            if (setError) {
                return reject(setError);
            }
            redis.expire(key, keyExpire, (expError) => {
                if (expError) {
                    return reject(expError);
                }
                return resolve(value);
            });
        });
    });
}

/**
 *
 * @param {string} id
 * @param {string} url
 * @returns {Promise}
 */
function getImageUrl(id, url) {
    const redisKey = 'dilbert:' + id;
    return cacheGet(redisKey)
        .then(cached => {
            if (cached) {
                return cached;
            }

            return fetchImageUrl(url)
                .then(cacheSet.bind(false, redisKey));
        });
}

/**
 * @param {string} xmlStr
 * @returns {Promise}
 */
function entryTransform(xmlStr) {
    return mapSeries(xmlStr.feed.entry, (el, idx) => {
        return getImageUrl(el.id.toString().replace(/-/g, ''), el.link[0].$.href)
            .then(imgUrl => {
                xmlStr.feed.entry[idx].content[0]._ = '<img src="' + imgUrl + '" />';
            });
    }).then(() => {
        return js2xml.buildObject(xmlStr);
    });
}

const register = function(server, options, next) {
    server.route({
        method: 'GET',
        path: '/dilbert',
        handler: function(request, reply) {
            rp('http://dilbert.com/feed')
                .then(parseToXml)
                .then(entryTransform)
                .then(function(result) {
                    return reply(result);
                });
        }
    });

    next();
};

register.attributes = {
    name: 'dilbert',
    version: '1.0.0'
};

module.exports = function(redisClient) {
    redis = redisClient;
    return {
        register: register
    };
};
