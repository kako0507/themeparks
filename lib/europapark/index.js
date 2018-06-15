const _ = require('lodash');
const moment = require('moment-timezone');

// crypto library for generating access tokens
const crypto = require('crypto');

// include core Park class
const Park = require('../park');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Implements the Europa Park API framework.
 * @class
 * @extends Park
 */
class EuropaPark extends Park {
  static parkName = 'Europa Park';
  static timezone = 'Europe/Berlin';
  static location = new GeoLocation({
    latitude: 48.268931,
    longitude: 7.721559,
  });

  /**
   * The API base URL for the park
   * @name EuropaPark.apiBase
   * @type {String}
   */
  static apiBase = 'https://api.europapark.de/';

  /**
   * The API version for the park
   * @name EuropaPark.apiVersion
   * @type {String}
   */
  static apiVersion = 'api-5.4';

  /**
   * The secret token for the park
   * @name EuropaPark.secretToken
   * @type {String}
   */
  static secretToken = 'ZhQCqoZp';

  /**
   * The user agent filter for the park
   * @name EuropaPark.userAgentFilter
   * @type {String}
   */
  static userAgentFilter = 'okhttp/2.7.0';

  /**
   * Generate an access token for accessing wait times
   * @returns {String} Current Access Token
   */
  generateAccessToken() {
    // generate wait times access code

    // start with current park date in UTC (YYYYMMDDHH format)
    const currentParkDate = moment.utc().format('YYYYMMDDHH');
    this.log('Calculated token date as', currentParkDate);

    // sha256 hash using key
    const hmac = crypto.createHmac('sha256', this.constructor.secretToken);
    hmac.update(currentParkDate);
    const code = hmac.digest('hex').toUpperCase();

    this.log('Generated Europa wait times code', code);

    return code;
  }

  /**
   * Fetches fresh or cached ride data from the park API
   * @returns {Promise<Object>}
   * Object of Ride ID => Ride Name in English
   * (or German if no English name is available)
   */
  fetchRideData() {
    return this.cache.wrap('ridedata', () => new Promise(((resolve, reject) => {
      // grab ride names from the API
      this.http({
        url: `${this.constructor.apiBase + this.constructor.apiVersion}/pointsofinterest`,
      }).then((rideData) => {
        // extract names from returned data
        const rideNames = _.mapValues(
          _.mapKeys(
            rideData,
            // types:
            //  1: ride
            //  2: food
            //  3: park entrance
            //  5: shop
            //  6: show
            poi => poi.code,
          ),
          // not all attractions have English names, so fallback to German if missing
          poi => poi.nameEnglish || poi.nameGerman,
        );
        resolve(rideNames);
      }, reject);
    })), 60 * 60 * 24);
  }

  /**
   * Fetch Wait times
   */
  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      // fetch ride names before getting wait times (usually this will come from the cache)
      this.fetchRideData().then((rideNames) => {
        this.http({
          url: `${this.constructor.apiBase}${this.constructor.apiVersion}/waitingtimes`,
          data: {
            mock: false,
            token: this.generateAccessToken(),
          },
        }).then((waitTimes) => {
          // if empty, park is just totally closed (!)
          if (!waitTimes.length) {
            // mark each ride as inactive
            // loop through previously known-about rides
            for (let i = 0; i < this.rides.length; i += 1) {
              this.rides[i].waitTime = -1;
            }

            // TODO - loop over a hard-coded list of known rides at the park

            // resolve early
            resolve();
            return;
          }

          waitTimes.forEach((ridetime) => {
            // FYI, ridetime.type:
            //   1: rollercoaster
            //   2: water
            //   3: adventure

            // status meanings:
            //  0: Open!
            //  1: Wait time is over 90 minutes
            //  2: Closed
            //  3: Broken Down
            //  4: Bad weather
            //  5: VIP/Special Tour
            //  other: Probably just crazy long wait times

            // get this ride's' object
            const rideObject = this.getRideObject({
              id: ridetime.code,
              name: rideNames[ridetime.code] || '???',
            });

            // lowest wait time is 1 minute (according to app)
            let waittime = ridetime.time > 0 ? ridetime.time : 0;
            const active = (ridetime.status === 0 || ridetime.status === 1);
            // copy how the app reacts to >90 minute waits
            if (ridetime.status === 1) waittime = 91;

            // set new wait time
            rideObject.waitTime = active ? waittime : -1;
          });

          resolve();
        }, reject);
      }, reject);
    }));
  }

  /**
   * Fetch Europa Park opening time data
   * @returns {Promise}
   */
  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      this.http({
        url: `${this.constructor.apiBase}${this.constructor.apiVersion}/openingtimes`,
      }).then((openingTimes) => {
        openingTimes.forEach((sched) => {
          this.schedule.setRange({
            startDate: moment.tz(sched.from, 'YYYY-MM-DD', this.constructor.timezone),
            endDate: moment.tz(sched.until, 'YYYY-MM-DD', this.constructor.timezone),
            openingTime: moment(sched.start, 'HH:mm'),
            closingTime: moment(sched.end, 'HH:mm'),
          });
        });

        // TODO - the park is actually closed on various days
        // and has announced varients to these times
        // find out how to get these properly!

        resolve();
      }, reject);
    }));
  }
}

// export the class
module.exports = EuropaPark;
