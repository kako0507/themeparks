const _ = require('lodash');
const moment = require('moment-timezone');

// include core Park class
const Park = require('../park');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

// load ride name data
const rawRideData = require('./AsterixData');

const rideData = _.mapKeys(rawRideData, ride => ride.code);

const reTime = /(\d+)h - (\d+|Minuit)(?:h?)/ig;
const reClosingTime = /(\d+)h(\d+)/;

/**
 * Implements the Asterix Park API
 * @class
 * @extends Park
 */
class AsterixPark extends Park {
  static parkName = 'Parc-Asterix';
  static timezone = 'Europe/Paris';
  static location = new GeoLocation({
    latitude: 49.136041,
    longitude: 2.572768,
  });
  // this park supports ride schedules
  static supportsRideSchedules = true;

  /**
   * The API base URL for Asterix park
   * @name AsterixPark.apiBase
   * @type {String}
   */
  static apiBase = 'https://www.parcasterix.fr/webservices/';

  /**
   * The API version for the park
   * @name AsterixPark.apiVersion
   * @type {String}
   */
  static apiVersion = '1';

  /**
   * The App version for Asterix park
   * @name AsterixPark.appVersion
   * @type {String}
   */
  static appVersion = '320';

  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      this.http({
        url: `${this.constructor.apiBase}api/attentix.json`,
        data: {
          device: 'android',
          version: this.constructor.appVersion,
          lang: 'fr',
          apiversion: this.constructor.apiVersion,
        },
      }).then((waittimes) => {
        // get opening hours and mark every ride as closed if the park is just actually closed
        this.getOpeningTimes().then((parkTimes) => {
          let allRidesClosed = true;
          let todaysOpeningHour;

          const now = moment();
          parkTimes.forEach((parkTime) => {
            if (parkTime.type === 'Operating' && now.isBetween(parkTime.openingTime, parkTime.closingTime)) {
              allRidesClosed = false;
              // remember the park's opening hour so we can fill in ride opening times later
              todaysOpeningHour = parkTime.openingTime;
            }
          });

          if (!waittimes.latency || !waittimes.latency.latency) {
            reject(new Error("API didn't return expected format"));
            return;
          }

          waittimes.latency.latency.forEach((ridetime) => {
            let rideObject = this.getRideObject({
              id: ridetime.attractionid,
              // ride name comes from hard-coded AsterixData.json file
              name: (
                rideData[ridetime.attractionid] &&
                rideData[ridetime.attractionid].title
              )
                ? rideData[ridetime.attractionid].title
                : '??',
            });

            // if park is closed, just mark all rides as closed
            if (allRidesClosed) {
              rideObject = -1;
              // FYI, latency = "A L'ARRET" / "INDISPONIBLE" / "FERME" / "X" (mn)
            } else if (ridetime.latency === "A L'ARRET" || ridetime.latency === 'INDISPONIBLE') {
              rideObject.waitTime = -2;
            } else if (ridetime.latency === 'FERME') {
              rideObject.waitTime = -1;
            } else {
              rideObject.waitTime = parseInt(ridetime.latency, 10);

              if (ridetime.closing_time) {
                const resultRe = reClosingTime.exec(ridetime.closing_time);
                if (resultRe) {
                  const closingMoment = moment
                    .tz(this.constructor.timezone)
                    .hours(parseInt(resultRe[1], 10))
                    .minutes(parseInt(resultRe[2], 10))
                    .seconds(0);
                  rideObject.schedule.setDate({
                    openingTime: todaysOpeningHour,
                    closingTime: closingMoment,
                    type: 'Operating',
                  });
                }
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
      this.http({
        url: `${this.constructor.apiBase}03/fr`,
        data: {
          device: 'android',
          version: this.constructor.appVersion,
          lang: 'fr',
          apiversion: this.constructor.apiVersion,
        },
      }).then((openingHours) => {
        if (!openingHours.agenda) {
          reject(new Error("API didn't return expected opening hours data"));
          return;
        }

        openingHours.agenda.forEach((agenda) => {
          const date = moment.tz(agenda.jour, 'DD-MM-YYYY', this.constructor.timezone);

          if (agenda.type === 'D') {
            // park is closed
            this.schedule.setDate({
              date,
              type: 'Closed',
            });
          } else if (agenda.type === 'A') {
            let resultRe;
            let firstResult = true;

            while ((resultRe = reTime.exec(agenda.horaire)) !== null) {
              // - Normal time
              this.schedule.setDate({
                date,
                openingTime: date
                  .clone()
                  .hours(parseInt(resultRe[1], 10))
                  .minutes(0)
                  .seconds(0),
                closingTime: (resultRe[2] === 'Minuit')
                  ? date.endOf('day')
                  : date
                    .clone()
                    .hours(parseInt(resultRe[2], 10))
                    .minutes(0)
                    .seconds(0),
                // can't send type for "special hours"
                type: !firstResult ? null : 'Operating',
                // first result is normal hours, any further dates are special hours
                specialHours: !firstResult,
              });

              // mark that we've parsed one set of opening hours, assume any others are special
              firstResult = false;
            }
          } else {
            this.log(`Unknown agenda type: ${agenda.type}`);
          }
        });

        resolve();
      }, reject);
    }));
  }
}

// export the class
module.exports = AsterixPark;
