const _ = require('lodash');
const moment = require('moment-timezone');

// include core Park class
const Park = require('../park');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Implements the Hershey Park API framework.
 * @class
 * @extends Park
 */
class HersheyPark extends Park {
  static parkName = 'Hershey Park';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 40.287681,
    longitude: -76.658579,
  });

  /**
   * The user agent filter for the park
   * @name HersheyPark.userAgentFilter
   * @type {String}
   */
  static userAgentFilter = 'Hersheypark Android App';

  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      // grab ride names first
      this.fetchRideNames().then((rideNames) => {
        this.http({
          url: 'https://hpapp.hersheypa.com/v1/rides/wait',
        }).then((waitTimes) => {
          if (!waitTimes.wait) {
            reject(new Error('API missing expecting format'));
            return;
          }

          waitTimes.wait.forEach((ride) => {
            if (!rideNames[ride.id]) return;

            const rideObject = this.getRideObject({
              id: ride.id,
              name: rideNames[ride.id].name,
            });

            rideObject.waitTime = ride.wait;
          });

          // closed rides are in this custom array
          waitTimes.closed.forEach((ride) => {
            if (!rideNames[ride]) return;

            const rideObject = this.getRideObject({
              id: ride,
              name: rideNames[ride].name,
            });

            rideObject.waitTime = -1;
          });

          resolve();
        }, reject);
      }, reject);
    }));
  }

  fetchRideNames() {
    return this.cache.wrap('ridenames', () => new Promise(((resolve, reject) => {
      // fetch fresh ridenames
      this.http({
        url: 'https://hpapp.hersheypa.com/v1/rides',
      }).then((rideData) => {
        const rideNames = _.mapKeys(
          rideData.map((ride) => {
            this.getRideObject({
              id: ride.id,
              name: ride.name,
            });
            return {
              id: ride.id,
              name: ride.name,
              latitude: ride.latitude,
              longitude: ride.longitude,
            };
          }),
          ride => ride.id,
        );
        resolve(rideNames);
      }, reject);
    })), 60 * 60 * 24);
  }

  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      // get 30 days of opening hours
      const today = moment().tz(this.constructor.timezone);
      const endDate = today.clone().add(30, 'day');
      const todo = [];
      for (let day = today.clone(); day.isSameOrBefore(endDate); day.add(1, 'day')) {
        todo.push(day.clone());
      }

      const step = () => {
        const c = todo.shift();

        if (!c) {
          resolve();
          return;
        }

        this.fetchDayOpeningHours(c).then((hours) => {
          this.schedule.setDate(hours);

          process.nextTick(step);
        }, reject);
      };

      process.nextTick(step);
    }));
  }

  /**
   * Fetch the opening hours for a specific day.
   * @param {MomentJS} date Date to request opening hours for (should be in correct timezone)
   */
  fetchDayOpeningHours(date) {
    if (!date) return Promise.reject(new Error('Invalid date object sent'));
    return this.cache.wrap(`openinghours_${date.format('YYYY-MM-DD')}`, () => new Promise(((resolve, reject) => {
      this.http({
        url: `https://hpapp.hersheypa.com/v1/hours/${date.startOf('day').format('X')}`,
      }).then((openingHours) => {
        const resolved = openingHours.some((hours) => {
          if (parseInt(hours.id, 10) === 9) {
            const matches = /([0-9]+:[0-9]{2})\s*([AP]M).*([0-9]+:[0-9]{2})\s*([AP]M)/.exec(hours.hours);
            if (matches) {
              resolve({
                openingTime: moment.tz(`${date.format('YYYY-MM-DD')}T${matches[1]}${matches[2]}`, 'YYYY-MM-DDTHH:mmA', this.constructor.timezone),
                closingTime: moment.tz(`${date.format('YYYY-MM-DD')}T${matches[3]}${matches[4]}`, 'YYYY-MM-DDTHH:mmA', this.constructor.timezone),
                type: 'Operating',
              });
              return true;
            }
          }
          return false;
        });

        if (resolved) return;

        // park not set or missing hours, so closed!
        resolve({
          date,
          type: 'Closed',
        });
      }, reject);
    })), 60 * 60 * 24 * 30);
  }
}

// export the class
module.exports = HersheyPark;
