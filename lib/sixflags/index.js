

const Park = require('../park');
const moment = require('moment-timezone');

/**
 * Implements the SixFlags API framework.
 * @class
 * @extends Park
 */
class SixFlagsPark extends Park {
  /**
   * Create new SixFlagsPark Object.
   * This object should not be called directly,
   * but rather extended for each of the individual SixFlags parks
   * @param {Object} options
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // assign park configurations
    if (!this.constructor.parkId) throw new Error("Missing park's API ID");
  }

  /**
   * The API base URL for Six Flags parks
   * @name SixFlagsPark.apiBase
   * @type {String}
   */
  static apiBase = 'https://api.sixflags.net/';

  /**
   * The API version for Six Flags parks
   * @name SixFlagsPark.apiVersion
   * @type {String}
   */
  static apiVersion = '6';

  /**
   * The Auth Token for the park
   * @name SixFlagsPark.authToken
   * @type {String}
   */
  static authToken = 'MEExQ0RGNjctMjQ3Ni00Q0IyLUFCM0ItMTk1MTNGMUY3NzQ3Ok10WEVKU0hMUjF5ekNTS3FBSVZvWmt6d2ZDUUFUNEIzTVhIZ20rZVRHU29xSkNBRDRXUHlIUnlYK0drcFZYSHJBNU9ZdUFKRHYxU3p3a3UxWS9sM0Z3PT0=';

  /**
   * Get the API base URL for making API requests
   * @returns {String} Base URL for the park's API (eg. https://api.sixflags.net/api/v6/)
   */
  static get apiUrl() {
    return `${this.apiBase}api/v${this.apiVersion}/`;
  }

  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      this.getRideNames().then((rideNames) => {
        this.getAPIUrl({
          url: `${this.constructor.apiUrl}park/${this.constructor.parkId}/rideStatus`,
        }).then((rideData) => {
          if (!rideData || !rideData.rideStatuses) {
            reject(new Error('Missing ridestatuses from API response'));
            return;
          }

          // loop over rides
          rideData.rideStatuses.forEach((ride) => {
            // find/create this ride in our park object
            const rideObject = this.getRideObject({
              id: ride.rideId,
              name: rideNames[ride.rideId],
            });

            if (rideObject) {
              // update ride time
              rideObject.waitTime = ride.status === 'AttractionStatusOpen'
                ? (parseInt(ride.waitTime, 10) || -1)
                : -1;
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
        url: `${this.constructor.apiUrl}park/${this.constructor.parkId}/hours`,
      }).then((scheduleData) => {
        if (scheduleData.message && scheduleData.message === 'No operating hours found for this park') {
          // edge-case! park is closed forever! (or not open yet)
          resolve();
          return;
        }

        if (!scheduleData.operatingHours) {
          reject(new Error('No operating hours returned by park'));
          return;
        }

        scheduleData.operatingHours.forEach((day) => {
          const thisDay = moment(day.operatingDate, 'YYYY-MM-DDTHH:mm:ss');
          this.schedule.setDate({
            openingTime: day.open ? moment.tz(day.open, 'YYYY-MM-DDTHH:mm:ss', this.constructor.timezone) : thisDay,
            closingTime: day.close ? moment.tz(day.close, 'YYYY-MM-DDTHH:mm:ss', this.constructor.timezone) : thisDay,
            type: 'Operating',
          });
        });
        resolve();
      }, reject);
    }));
  }

  /**
   * Get an access token for making Six Flags API requests
   */
  getAccessToken() {
    // default ttl for an access token (in case we don't get an expirey time correctly)
    let ttl = 60 * 30;
    return this.cache.wrap('accesstoken', () => new Promise(((resolve, reject) => {
      this.http({
        url: `${this.constructor.apiBase}Authentication/identity/connect/token`,
        method: 'POST',
        headers: {
          Authorization: `Basic ${this.constructor.authToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        data: {
          grant_type: 'client_credentials',
          scope: 'mobileApp',
        },
        forceJSON: true,
      }).then((body) => {
        if (!body) {
          reject(new Error('No body returned for access token'));
          return;
        }
        if (!body.access_token) {
          reject(new Error('No access_token returned'));
          return;
        }

        this.log('Fetched access token', body.access_token);

        ttl = body.expires_in || 60 * 30;

        resolve(body.access_token);
      }, reject);
    })), () => ttl);
  }

  /**
   * Get rides names for all the rides in this park
   * This is either fetched from cache or fresh from the API if not fetched for a while
   * @returns {Promise<Object>} Object of Ride IDs => Ride Names
   */
  getRideNames() {
    return this.cache.wrap('rides', () => new Promise(((resolve, reject) => {
      // get ride name data
      this.getAPIUrl({
        url: `${this.constructor.apiUrl}park/${this.constructor.parkId}/ride`,
      }).then((body) => {
        if (!body) {
          reject(new Error('No body recieved'));
          return;
        }
        if (!body.rides) {
          reject(new Error('No rides returned'));
          return;
        }

        // interesting fields
        //  name
        //  location.latitude
        //  location.longitude
        //  location.radius
        //  rides
        //  waitTimesLastUpdated

        const rideNames = {};
        body.rides.forEach((ride) => {
          // interesting fields
          //  isFlashPassEligible
          //  status
          //  waitTime
          rideNames[ride.rideId] = ride.name;

          // this is also where fastPass is determined, so update our rides here
          const rideObject = this.getRideObject({
            id: ride.rideId,
            name: ride.name,
          });
          if (rideObject) {
            rideObject.fastPass = ride.isFlashPassEligible || false;
          }
        });
        resolve(rideNames);
      }, reject);
    })), 60 * 60 * 12);
  }

  getAPIUrl(requestObject) {
    return new Promise(((resolve, reject) => {
      // grab an access token first
      this.getAccessToken().then((accessToken) => {
        // make sure headers exist if they weren't set already
        const headers = requestObject.headers || {};
        // send network request
        this.http({
          ...requestObject,
          headers: {
            ...headers,
            'Accept-Language': 'en-US',
            Connection: 'Keep-Alive',
            Authorization: `Bearer ${accessToken}`,
          },
          // make sure we get JSON back
          forceJSON: true,
        }).then(resolve, reject);
      }, reject);
    }));
  }
}

module.exports = SixFlagsPark;
