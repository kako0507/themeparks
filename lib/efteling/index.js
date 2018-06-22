const _ = require('lodash');
const crypto = require('crypto');
const moment = require('moment-timezone');

const Park = require('../park');

const GeoLocation = require('../geoLocation');

/**
 * Implements the Efteling API framework.
 * @class
 * @extends Park
 */
class Efteling extends Park {
  static parkName = 'Efteling';
  static timezone = 'Europe/Amsterdam';
  static location = new GeoLocation({
    latitude: 51.64990915659694,
    longitude: 5.043561458587647,
  });

  /**
   * The API version for the park
   * @name Efteling.apiVersion
   * @type {String}
   */
  static apiVersion = '4';

  /**
   * The setting of URL generation
   * @name Efteling.disgestKey
   * @type {String}
   */
  static disgestKey = 'blblblblbla';

  /**
   * The key of crypto
   * @name Efteling.cryptoKey
   * @type {String}
   */
  static cryptoKey = '1768257091023496';

  /**
   * The algorithm of crypto
   * @name Efteling.cryptoCipher
   * @type {String}
   */
  static cryptoCipher = 'aes-128-cbc';

  /**
   * The initialization vector of crypto
   * @name Efteling.cryptoIv
   * @type {String}
   */
  static cryptoIv = Buffer.from([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);

  /**
   * The URL for searching
   * @name Efteling.searchUrl
   * @type {String}
   */
  static searchUrl = 'http://prd-search-acs.efteling.com/2013-01-01/';

  /**
   * The URL for fetching the raw wait times
   * @name Efteling.waitTimesUrl
   * @type {String}
   */
  static waitTimesUrl = 'https://mobile-services.efteling.com/wis/';

  /**
   * Get POI data for this park (from the cache or fetch fresh data if none is cached)
   * @returns {Promise}
   */
  getPOIData() {
    return this.cache.wrap('poidata', this.fetchPOIData.bind(this), 60 * 60 * 24);
  }

  /**
   * Fetch POI data for the park.
   * Don't call this function directly unless you know what you're doing.
   * Use getPOIData instead to use cached data when possible.
   * @returns {Promise}
   * Object of Ride IDs => Object containing name and location
   * (GeoLocation object, if location is available for this ride)
   */
  fetchPOIData() {
    return this.makeRequest({
      url: `${this.constructor.searchUrl}search`,
      data: {
        size: 1000,
        'q.parser': 'structured',
        q: "(phrase field=language 'en')",
      },
    }).then((result) => {
      if (!result || !result.hits || !result.hits.hit) {
        throw new Error(`No results returned for POI data for Efteling Park: ${result}`);
      }

      return _.mapKeys(
        result.hits.hit
          .filter(hit => (
            hit.fields &&
            // ignore non-attractions
            hit.fields.category === 'attraction'
          ))
          .map((hit) => {
            const poiItem = {
              id: hit.fields.id,
              name: hit.fields.name,
            };

            // try to parse lat/long
            //  edge-case: some rides have dud "0.0,0.0" location, ignore these
            if (hit.fields.latlon && hit.fields.latlon !== '0.0,0.0') {
              const match = /([0-9.]+),([0-9.]+)/.exec(hit.fields.latlon);
              if (match) {
                poiItem.location = new GeoLocation({
                  latitude: match[1],
                  longitude: match[2],
                });
              }
            }

            return poiItem;
          }),
        poiItem => poiItem.id,
      );
    });
  }

  /**
   * Fetch park wait times
   * @returns {Promise}
   */
  fetchWaitTimes() {
    // first, get POI data
    return this.getPOIData().then(poiData =>
      // then, get latest wait time results
      this.fetchWaitTimesData().then((waitData) => {
        // parse and inject into park data
        if (!waitData.AttractionInfo) throw new Error('No AttractionInfo found for Efteling Park response');

        waitData.AttractionInfo.forEach((item) => {
          // check we have POI data and item is an attraction
          if (item.Type === 'Attraction' && poiData[item.Id]) {
            const rideObject = this.getRideObject({
              id: item.Id,
              name: poiData[item.Id].name,
            });

            if (rideObject) {
              // update ride with wait time data
              // if the State isn't "open", assume ride is closed
              // TODO - learn how Efteling marks rides as under refurb and set = -2
              rideObject.waitTime = item.State === 'open'
                ? parseInt(item.WaitingTime, 10)
                : -1;
            }
          }
        });

        return Promise.resolve();
      }));
  }

  /**
   * Fetch the raw wait times data for Efteling Park
   */
  fetchWaitTimesData() {
    return this.makeRequest({
      url: this.constructor.waitTimesUrl,
    });
  }

  /**
   * Decrypt an encrypted string from the Efteling API
   * @param {String|Buffer} data
   */
  decryptString(data) {
    // step 1: decode Base64 (make sure it's in ascii format first,
    // since it's a base64 string in text, not actual base64 data)
    const decodedBuffer = Buffer.from(data.toString('ascii'), 'base64');
    // step 2: setup decryption
    const decipher = crypto.createDecipheriv(
      this.constructor.cryptoCipher,
      this.constructor.cryptoKey,
      this.constructor.cryptoIv,
    );
    // step 3: decrypt and return as utf8 string
    return Buffer.concat([
      decipher.update(decodedBuffer),
      decipher.final(),
    ]).toString('utf8');
  }

  /**
   * Generate a digest for given URL
   * @param {String} URL
   */
  getDigest(url) {
    // remove http(s) from string
    // generate digest
    const hmac = crypto.createHmac('sha256', this.constructor.disgestKey);
    hmac.update(url.replace(/^https?:\/\//, ''));
    return hmac.digest('hex');
  }

  /**
   * Make an API request against the Efteling API
   * Injects required headers and passes request through to standard HTTP method
   * See HTTP for full documentation on how to use
   * @param {Object} requestOptions
   * @return {Promise}
   */
  makeRequest(requestOptions) {
    if (!requestOptions.url) {
      return Promise.error('No URL supplied');
    }

    // generate digest needed to make URL request
    const digest = this.getDigest(requestOptions.url);
    this.log(`Generated digest for url "${requestOptions.url}": ${digest}`);

    // add our required headers
    const headers = requestOptions.headers || {};
    headers['X-Digest'] = digest;
    headers['X-Api-Version'] = this.constructor.apiVersion;
    if (requestOptions.body || requestOptions.data) {
      headers['Content-Type'] = 'application/json';
    }

    return this.http({
      ...requestOptions,
      headers,
      // return full body (so we don't try to auto-parse JSON data as it's often encrypted)
      returnFullResponse: true,
      // don't auto-JSON request or response
      json: false,
    }).then((response) => {
      // intercept the HTTP method's response to sort out any encrypted data responses...

      if (!response.body) return Promise.reject(new Error('Failed to get network response'));

      // check if we've already got a valid JSON object as a response
      if (
        response.body.constructor === {}.constructor ||
        response.body.constructor === [].constructor
      ) {
        return Promise.resolve(response.body);
      }

      // try to parse result body into JSON first
      let JSONResult;
      try {
        JSONResult = JSON.parse(response.body);
        return Promise.resolve(JSONResult);
      } catch (e1) {
        // failed to parse JSON data? assume it's encrypted and decrypt it first
        let decryptedString;
        try {
          decryptedString = this.decryptString(response.body);
        } catch (e2) {
          throw new Error(`Failed to decrypt string: ${response.body}`);
        }

        // got decrypted string, try to parse it
        try {
          JSONResult = JSON.parse(decryptedString);
          return Promise.resolve(JSONResult);
        } catch (e3) {
          // also failed to parse decrypted data? reject
          throw new Error(`Failed to parse decrypted Efteling string: ${decryptedString}`);
        }
      }
    });
  }

  /**
   * Request park opening times.
   * @returns {Promise}
   */
  fetchOpeningTimes() {
    // calculate how many (and which) months we want to check
    const endMonth = moment.tz(this.constructor.timezone).add(this.constructor.scheduleDays, 'days');
    const datePointer = moment.tz(this.constructor.timezone);
    const months = [];

    this.log(`Fetching opening hours between ${datePointer.format()} and ${endMonth.format()}`);

    // slide along between start and end until we go past endMonth
    // to get an array of required month/year combos
    while (datePointer.isSameOrBefore(endMonth, 'month')) {
      months.push({
        month: datePointer.format('M'),
        year: datePointer.format('YYYY'),
      });
      datePointer.add(1, 'months');
    }

    // loop through each month, calling fetchOpeningTimesByMonth
    return Promise
      .all(months.map(month => this.fetchOpeningTimesByMonth(month.month, month.year)))
      .then((results) => {
        // inject results into calendar
        results.forEach((hours) => {
          hours.forEach((times) => {
            this.schedule.setDate({
              date: times.open,
              openingTime: times.open,
              closingTime: times.close,
            });
          });
        });
        return results;
      });
  }

  /**
   * Fetch park opening times for a specific month and add to park's opening times
   * @param {String} month
   * @param {String} [year]
   * @returns {Promise} Array of Objects containing "open" and "close" moment objects
   */
  fetchOpeningTimesByMonth(month, y) {
    // default to current year if none supplied
    const year = y || moment.tz(this.constructor.timezone).format('YYYY');

    return this.http({
      url: `https://www.efteling.com/service/cached/getpoiinfo/en/${year}/${month}`,
      headers: {
        'X-Requested-With': 'XMLHttpRequest',
      },
    }).then((data) => {
      if (!data) throw new Error(`Invalid data returned for park opening hours for ${month}/${year}`);
      if (!data.OpeningHours) throw new Error(`No park opening hours data returned for ${month}/${year}`);

      // build array of moment objects for each open and close time
      return data.OpeningHours.map(date => ({
        open: moment.tz(`${date.Date}${date.Open}`, 'YYYY-MM-DDHH:mm', this.constructor.timezone),
        close: moment.tz(`${date.Date}${date.Close}`, 'YYYY-MM-DDHH:mm', this.constructor.timezone),
      }));
    });
  }
}

module.exports = Efteling;
