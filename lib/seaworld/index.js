

const _ = require('lodash');
const moment = require('moment-timezone');

const Park = require('../park');

/**
 * Implements the Seaworld API framework.
 * @class
 * @extends Park
 */
class SeaworldPark extends Park {
  /**
   * Create new SeaworldPark Object.
   * This object should not be called directly,
   * but rather extended for each of the individual SeaWorld parks
   * @param {Object} options
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // assign park configurations
    if (!this.constructor.parkId) throw new Error("Missing park's API ID");
  }

  /**
   * The API base URL for the park
   * @name SeaworldPark.apiBase
   * @type {String}
   */
  static apiBase = 'https://seas.te2.biz/v1/rest/';

  /**
   * The Auth Token for the park
   * @name SeaworldPark.authToken
   * @type {String}
   */
  static authToken = 'seaworld:1393288508';

  /**
   * The array of valid ride types.
   * Some implementations of the API use various types to declare rides
   * @name SeaworldPark.rideTypes
   * @type {Array}
   */
  static rideTypes = ['Ride', 'Coasters', 'Family', 'ThrillRides', 'Kids'];

  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      // first make sure we have our ride names
      this.getRideNames().then((rideNames) => {
        this.getAPIUrl({
          url: `${this.constructor.apiBase}venue/${this.constructor.parkId}/poi/all/status`,
        }).then((waitTimeData) => {
          waitTimeData.forEach((ride) => {
            // find/create this ride object (only if we have a name for it)
            if (rideNames[ride.id]) {
              const rideObject = this.getRideObject({
                id: ride.id,
                name: rideNames[ride.id],
              });

              if (rideObject && ride.status) {
                // update ride wait time
                rideObject.waitTime = ride.status.waitTime || (ride.status.isOpen ? 0 : -1);
              }
            }
          });
          resolve();
        }, reject);
      }, reject);
    }));
  }

  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      this.getAPIUrl({
        url: `${this.constructor.apiBase}venue/${this.constructor.parkId}/hours/${moment().tz(this.constructor.timezone).format('YYYY-MM-DD')}`,
        data: {
          days: 30,
        },
      }).then((scheduleData) => {
        scheduleData.forEach((day) => {
          const thisDay = moment(day.date, 'YYYY-MM-DD');
          this.schedule.setDate({
            date: thisDay,
            openingTime: day.open
              ? moment(day.open, 'YYYY-MM-DDTHH:mm:ss.SSSZZ').tz(this.constructor.timezone)
              : thisDay,
            closingTime: day.close
              ? moment(day.close, 'YYYY-MM-DDTHH:mm:ss.SSSZZ').tz(this.constructor.timezone)
              : thisDay,
            type: day.isOpen ? 'Operating' : 'Closed',
          });
        });
        resolve();
      }, reject);
    }));
  }

  /**
   * Get cached (or fresh fetch) of ride names
   * @returns {Promise<Object>} Object of Ride ID => Ride name in English
   */
  getRideNames() {
    return new Promise(((resolve, reject) => {
      // wrap cache request (cache ride names for 24 hours)
      this.cache.wrap('ridenames', this.fetchRideNames.bind(this), 60 * 60 * 24).then(resolve, reject);
    }));
  }

  /**
   * Fetch all the rides and ride names for this park from the API (skip the cache)
   * @returns {Promise<Object>} Object of Ride ID => Ride name in English
   */
  fetchRideNames() {
    return new Promise(((resolve, reject) => {
      this.log(`Fetching ride names for ${this.constructor.parkName}`);

      // fetch POI (points-of-interest) data from API
      this.getAPIUrl({
        url: `${this.constructor.apiBase}venue/${this.constructor.parkId}/poi/all`,
      }).then((rideData) => {
        if (!rideData) {
          reject(new Error('No POI data returned from Seaworld API'));
          return;
        }

        const rideNames = {};
        rideData.forEach((poi) => {
          // only include POI data for rides
          if (this.constructor.rideTypes.indexOf(poi.type) >= 0) {
            // grab "label", which is the English title for each POI
            rideNames[poi.id] = poi.label;
          }
        });
        _.mapValues(
          _.mapKeys(
            rideData.filter(poi => this.constructor.rideTypes.indexOf(poi.type) >= 0),
            poi => poi.id,
          ),
          poi => poi.label,
        );
        resolve(rideNames);
      }, reject);
    }));
  }

  getAPIUrl(requestObject) {
    return new Promise(((resolve, reject) => {
      // make sure headers exist if they weren't set already
      const headers = requestObject.headers || {};

      // send network request
      this.http({
        ...requestObject,
        headers: {
          ...headers,
          Authorization: `Basic ${Buffer.from(this.constructor.authToken).toString('base64')}`,
        },
        // make sure we get JSON back
        forceJSON: true,
      }).then(resolve, reject);
    }));
  }
}

module.exports = SeaworldPark;
