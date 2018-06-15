// moment date/time library
const moment = require('moment-timezone');

// base park objects
const Park = require('../park');

// include our Promise library
const Promise = require('../promise');

// API settings
const baseUrl = 'http://pulse.hfecorp.com/api/waitTimes/';

/**
 * Implements the Walt Disney World API framework. All Disney parks use this one API.
 * @class
 * @extends Park
 */
class HerschendBase extends Park {
  /**
   * Create new HerschendBase Object.
   * This object should not be called directly,
   * but rather extended for each of the individual Herschend Parks
   * @param {Object} options
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // check we have our parkId
    if (!this.constructor.parkId) {
      throw new Error('No parkId supplied for Herschend park');
    }

    if (!this.constructor.parkIds) {
      throw new Error('No parkIds supplied for Herschend park');
    }

    if (!this.constructor.calendarUrl) {
      throw new Error('No calendar URL supplied for Herschend park');
    }
  }

  /**
   * Fetch this Herschend Park's waiting times
   * @returns {Promise}
   */
  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      this.http({
        url: baseUrl + this.constructor.parkId,
      }).then((body) => {
        body.forEach((ride) => {
          const rideObject = this.getRideObject({
            id: ride.rideId,
            name: ride.rideName,
          });

          // Assume that all "UNKNOWN" times are closed rides.
          if (ride.operationStatus.includes('CLOSED') || ride.operationStatus.includes('UNKNOWN')) {
            rideObject.waitTime = -1;
          } else if (ride.waitTimeDisplay.includes('UNDER')) {
            // Wait time is not defined if text says "Under x minutes" -
            // we'll set the ride time to x
            rideObject.waitTime = parseInt(ride.waitTimeDisplay.split(' ')[1], 10);
          } else {
            rideObject.waitTime = parseInt(ride.waitTime, 10);
          }
        });

        return resolve();
      }, reject);
    }));
  }

  /**
   * Fetch this Herschend Park's opening times
   * @returns {Promise}
   */
  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      // get today's date and add on a month to get a decent range of dates
      const rangeStart = moment.tz(this.constructor.timezone).format('YYYY-MM-DD');

      this.http({
        url: `https://${this.constructor.calendarUrl}/sitecore/api/hfe/hfedata/dailyschedulebytime`,
        data: {
          date: rangeStart,
          days: 30,
          parkids: this.constructor.parkIds,
        },
        headers: {
          Authorization: 'Basic ZXh0cmFuZXRcYXBpdXNlcjpKdzdvZGh3RkhwSzRKZw==',
        },
      }).then((scheduleData) => {
        // parse each schedule entry
        scheduleData.forEach((day) => {
          if (day.schedule.parkHours[0].from) {
            this.schedule.setDate({
              date: moment.tz(day.date, 'YYYY-MM-DD', this.constructor.timezone),
              openingTime: moment.tz(day.schedule.parkHours[0].from, 'YYYY-MM-DDTHH:mm:ss', this.constructor.timezone),
              closingTime: moment.tz(day.schedule.parkHours[0].to, 'YYYY-MM-DDTHH:mm:ss', this.constructor.timezone),
            });
          } else {
            this.schedule.setDate({
              date: moment.tz(day.date, 'YYYY-MM-DD', this.constructor.timezone),
              type: 'Closed',
            });
          }
        });
        resolve();
      }, reject);
    }));
  }
}

// export just the Base Herschend Park class
module.exports = HerschendBase;
