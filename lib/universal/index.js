const moment = require('moment-timezone');

// crypto lib for generating access token signature
const crypto = require('crypto');

// include core Park class
const Park = require('../park');

// park IDs:
//  Studios: 10010
//  Islands: 10000
//  CityWalk: 10011
//  Wet 'N Wild: 45084

/**
 * Implements the Universal API framework. All Universal parks use this one API.
 * @class
 * @extends Park
 */
class UniversalPark extends Park {
  /**
   * Create new UniversalPark Object.
   * This object should not be called directly,
   * but rather extended for each of the individual Universal parks
   * @param {Object} options
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // grab Universal API configs for this park instance
    if (!this.constructor.parkId) throw new Error("Missing park's API ID");
  }

  /**
   * Override fastPass to declare support for fast pass
   * @name UniversalPark.fastPass
   * @type {Boolean}
   */
  static fastPass = true;

  /**
   * Days of opening times to return with getOpeningTimes()
   * @name UniversalPark.scheduleDays
   * @type {Number}
   */
  static scheduleDays = 90;

  // API settings
  static baseURL = 'https://services.universalorlando.com/api/';
  static appKey = 'AndroidMobileApp';
  static appSecret = 'AndroidMobileAppSecretKey182014';

  /**
   * Get our current access token
   * @returns {Promise}
   */
  getAccessToken() {
    let receivedTtl;

    return this.cache.wrap(
      'accesstoken',
      () => new Promise(((resolve, reject) => {
        // Get access token
        // generate access token signature
        //  calculate current date to generate access token signature
        const today = `${moment.utc().format('ddd, DD MMM YYYY HH:mm:ss')} GMT`;

        // create signature to get access token
        const signatureBuilder = crypto.createHmac('sha256', this.constructor.appSecret);
        signatureBuilder.update(`${this.constructor.appKey}\n${today}\n`);
        // generate hash from signature builder
        //  also convert trailing equal signs to unicode. because. I don't know
        const signature = signatureBuilder.digest('base64').replace(/=$/, '\u003d');

        // request new access token
        this.http({
          url: this.constructor.baseURL,
          method: 'POST',
          headers: {
            Date: today,
          },
          body: {
            apiKey: this.constructor.appKey,
            signature,
          },
        }).then(
          (body) => {
            // check we actually got the token back
            if (!body.Token) {
              this.log(body.toString('ascii'));
              reject(new Error('Missing access token from Universal API'));
              return;
            }

            const expireyDate = moment(body.TokenExpirationString, 'YYYY-MM-DDTHH:mm:ssZ');
            const now = moment();
            // expire this access token a minute before the API says (just to be sure)
            receivedTtl = expireyDate.diff(now, 'seconds') - 60;

            // resolve with our new access token (Wrap will cache for us)
            resolve(body.Token);
          },
          (err) => {
            this.log(`Error fetching Universal Access Token: ${err}`);
            reject(err);
          },
        );
      })),
      // Ttl callback setter
      () => receivedTtl,
    );
  }

  /**
   * Fetch a URL from the Universal API
   */
  getAPIUrl(requestObject) {
    return this.getAccessToken().then((accessToken) => {
      // make sure headers exist if they weren't set already
      let headers = {
        ...(requestObject.headers || {}),
        Accept: 'application/json',
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept-Language': 'en-US',
      };

      // add our access token to the request
      if (accessToken) {
        headers = {
          ...headers,
          'X-UNIWebService-ApiKey': this.constructor.appKey,
          'X-UNIWebService-Token': accessToken,
        };
      }

      // send network request
      return this.http({
        ...requestObject,
        headers,
      });
    });
  }

  /**
   * Fetch this Universal Park's waiting times
   * @returns {Promise}
   */
  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      // ride wait time data is kept in the pointsOfInterest URL
      this.getAPIUrl({
        url: `${this.constructor.baseURL}pointsOfInterest`,
        data: this.constructor.parkCity
          ? { city: this.constructor.parkCity }
          : null,
      }).then((body) => {
        if (!body || !body.Rides) {
          reject(new Error('Universal POI data missing Rides array'));
          return;
        }

        body.Rides.forEach((ride) => {
          // skip if this ride isn't for our current park
          // TODO - store poiData separately for both parks to access
          if (ride.VenueId !== this.constructor.parkId) return;

          // waitTimes assumed key:
          //  -1 seems to mean "closed"
          //  -2 means "delayed", which I guess is a nice way of saying "broken"
          //  -3 and -50 seems to mean planned closure

          // find/create this ride
          const rideObject = this.getRideObject({
            id: ride.Id,
            name: ride.MblDisplayName,
          });

          // update wait time
          rideObject.waitTime = ride.WaitTime;
          // update fastPass status
          rideObject.fastPass = ride.ExpressPassAccepted;
        });
        resolve();
      }, reject);
    }));
  }

  /**
   * Fetch this Universal Park's opening times
   * @returns {Promise}
   */
  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      // pick a date 1 month from now
      // (in middle/lowest/highest form MM/DD/YYYY, because I don't know)
      const hoursEndDate = moment().add(12, 'months').format('MM/DD/YYYY');

      this.getAPIUrl({
        url: `${this.constructor.baseURL}venues/${this.constructor.parkId}/hours`,
        data: {
          endDate: hoursEndDate,
          city: this.constructor.parkCity ? this.constructor.parkCity : null,
        },
      }).then((body) => {
        if (!body || !body.length) {
          reject(new Error('No venue hour data found from Universal API'));
          return;
        }

        // find all published opening times for the next year and insert into our schedule
        body.forEach((day) => {
          this.schedule.setDate({
            // for ease, we'll just parse the Unix timestamp
            openingTime: moment.tz(day.OpenTimeString, 'YYYY-MM-DDTHH:mm:ssZ', this.constructor.timezone),
            closingTime: moment.tz(day.CloseTimeString, 'YYYY-MM-DDTHH:mm:ssZ', this.constructor.timezone),
          });
        });

        resolve();
      }, reject);
    }));
  }
}

// export the class
module.exports = UniversalPark;
