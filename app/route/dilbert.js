/* eslint-disable strict */

'use strict';

const rp = require('request-promise');
const xml2js = require('xml2js');
const xpath = require('xpath');
const Dom = require('xmldom').DOMParser;
const mapSeries = require('promise-map-series');

const js2xml = new xml2js.Builder({ cdata: true });
const DAY = 60 * 60 * 24;
const keyExpire = DAY * 9;

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
  return new Promise((resolve, reject) => {
    let result;
    try {
      xml2js.parseString(body, (err, res) => {
        if (err) {
          result = reject(err);
        } else {
          result = resolve(res);
        }
      });
    } catch (error) {
      result = reject(error);
    }
    return result;
  });
}

const handler = redis => (request, reply) => {
  /**
   *
   * @param {string} key
   * @returns {Promise}
   */
  function cacheGet(key) {
    return redis.getAsync(key);
  }

  /**
   *
   * @param {string} key
   * @param {string} value
   * @returns {Promise}
   */
  function cacheSet(key, value) {
    return redis.setAsync(key, value)
    .then(() => redis.expireAsync(key, keyExpire));
  }

  /**
   *
   * @param {string} id
   * @param {string} url
   * @returns {Promise}
   */
  function getImageUrl(id, url) {
    const redisKey = `dilbert:${id}`;
    return cacheGet(redisKey)
      .then((cached) => {
        if (cached) {
          return cached;
        }

        return fetchImageUrl(url)
          .then(cacheSet.bind(false, redisKey));
      });
  }

  /**
   * @param {Object} xmlStr
   * @returns {Promise}
   */
  function entryTransform(xmlStr) {
    return mapSeries(xmlStr.feed.entry, el => (
      getImageUrl(el.id.toString().replace(/-/g, ''), el.link[0].$.href)
      .then(imgUrl => Object.assign({}, el, {
        content: [{ _: `<img src="${imgUrl}" />` }],
        description: [{ _: `<img src="${imgUrl}" />` }],
        'media:thumbnail': { $: { url: imgUrl } }
      }))
    ))
    .then(feedEntries => js2xml.buildObject(Object.assign({},
        xmlStr, { feed: { entry: feedEntries } })));
  }

  return rp('http://dilbert.com/feed')
    .then(parseToXml)
    .then(entryTransform)
    .then(result => reply(result));
};

module.exports = redisClient => ({
  method: 'GET',
  path: '/dilbert',
  handler: handler(redisClient),
});

