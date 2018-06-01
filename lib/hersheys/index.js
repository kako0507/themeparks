// include core Park class
const Park = require('../park');

const Moment = require('moment-timezone');

/**
 * Implements the Hershey Park API framework.
 * @class
 * @extends Park
 */
class HersheyPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Hershey Park';
    options.timezone = options.timezone || 'America/New_York';
    options.latitude = options.latitude || 40.287681;
    options.longitude = options.longitude || -76.658579;

    options.useragent = 'Hersheypark Android App';

    // inherit from base class
    super(options);
  }

  FetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      // grab ride names first
      this.FetchRideNames().then((rideNames) => {
        this.HTTP({
          url: 'https://hpapp.hersheypa.com/v1/rides/wait',
        }).then((waitTimes) => {
          if (!waitTimes.wait) return reject('API missing expecting format');

          let rideObject;
          for (var i = 0, ride; ride = waitTimes.wait[i++];) {
            if (!rideNames[ride.id]) continue;

            rideObject = this.GetRideObject({
              id: ride.id,
              name: rideNames[ride.id].name,
            });

            rideObject.WaitTime = ride.wait;
          }

          // closed rides are in this custom array
          for (i = 0, ride; ride = waitTimes.closed[i++];) {
            if (!rideNames[ride]) continue;

            rideObject = this.GetRideObject({
              id: ride,
              name: rideNames[ride].name,
            });

            rideObject.WaitTime = -1;
          }

          resolve();
        }, reject);
      }, reject);
    }));
  }

  FetchRideNames() {
    return this.Cache.Wrap('ridenames', () => new Promise(((resolve, reject) => {
      // fetch fresh ridenames
      this.HTTP({
        url: 'https://hpapp.hersheypa.com/v1/rides',
      }).then((rideData) => {
        const rideNames = {};
        for (var i = 0, ride; ride = rideData[i++];) {
          rideNames[ride.id] = {
            name: ride.name,
            latitude: ride.latitude,
            longitude: ride.longitude,
          };
        }
        resolve(rideNames);
      }, reject);
    })), 60 * 60 * 24);
  }

  FetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      // get 30 days of opening hours
      const today = Moment().tz(this.Timezone);
      const endDate = today.clone().add(30, 'day');
      const todo = [];
      for (let day = today.clone(); day.isSameOrBefore(endDate); day.add(1, 'day')) {
        todo.push(day.clone());
      }

      var step = function () {
        const c = todo.shift();

        if (!c) {
          return resolve();
        }
        this.FetchDayOpeningHours(c).then((hours) => {
          this.Schedule.SetDate(hours);

          process.nextTick(step);
        }, reject);
      }.bind(this);

      process.nextTick(step);
    }));
  }

  /**
     * Fetch the opening hours for a specific day.
     * @param {MomentJS} date Date to request opening hours for (should be in correct timezone)
     */
  FetchDayOpeningHours(date) {
    if (!date) return Promise.reject('Invalid date object sent');
    return this.Cache.Wrap(`openinghours_${date.format('YYYY-MM-DD')}`, () => new Promise(((resolve, reject) => {
      this.HTTP({
        url: `https://hpapp.hersheypa.com/v1/hours/${date.startOf('day').format('X')}`,
      }).then((openingHours) => {
        for (var i = 0, hours; hours = openingHours[i++];) {
          if (hours.id == 9) {
            const matches = /([0-9]+:[0-9]{2})\s*([AP]M).*([0-9]+:[0-9]{2})\s*([AP]M)/.exec(hours.hours);
            if (matches) {
              return resolve({
                openingTime: Moment.tz(`${date.format('YYYY-MM-DD')}T${matches[1]}${matches[2]}`, 'YYYY-MM-DDTHH:mmA', this.Timezone),
                closingTime: Moment.tz(`${date.format('YYYY-MM-DD')}T${matches[3]}${matches[4]}`, 'YYYY-MM-DDTHH:mmA', this.Timezone),
                type: 'Operating',
              });
            }
          }
        }

        // park not set or missing hours, so closed!
        return resolve({
          date,
          type: 'Closed',
        });
      }, reject);
    })), 60 * 60 * 24 * 30);
  }
}

// export the class
module.exports = HersheyPark;
