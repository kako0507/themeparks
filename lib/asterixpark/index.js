// include core Park class
const Park = require('../park');

const Moment = require('moment-timezone');

// load ride name data
const rawRideData = require(`${__dirname}/AsterixData.js`);
const rideData = {};
for (var i = 0, ride; ride = rawRideData[i++];) {
  rideData[ride.code] = ride;
}

const s_apiBase = Symbol();
const s_apiVersion = Symbol();
const s_appVersion = Symbol();

const reTime = /(\d+)h - (\d+|Minuit)(?:h?)/ig;
const reClosingTime = /(\d+)h(\d+)/;

/**
 * Implements the Asterix Park API
 * @class
 * @extends Park
 */
class AsterixPark extends Park {
  constructor(options = {}) {
    options.name = options.name || 'Parc-Asterix';
    options.timezone = options.timezone || 'Europe/Paris';
    options.latitude = options.latitude || 49.136041;
    options.longitude = options.longitude || 2.572768;

    // inherit from base class
    super(options);

    // API Options
    this[s_apiBase] = options.api_base || 'https://www.parcasterix.fr/webservices/';
    this[s_apiVersion] = options.api_version || '1';
    this[s_appVersion] = options.app_version || '320';
  }

  // this park supports ride schedules
  get SupportsRideSchedules() {
    return true;
  }

  FetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      this.HTTP({
        url: `${this[s_apiBase]}api/attentix.json`,
        data: {
          device: 'android',
          version: this[s_appVersion],
          lang: 'fr',
          apiversion: this[s_apiVersion],
        },
      }).then((waittimes) => {
        // get opening hours and mark every ride as closed if the park is just actually closed
        this.GetOpeningTimes().then((parkTimes) => {
          let allRidesClosed = true;
          let todaysOpeningHour;

          const now = Moment();
          for (var i = 0, parkTime; parkTime = parkTimes[i++];) {
            if (parkTime.type == 'Operating' && now.isBetween(parkTime.openingTime, parkTime.closingTime)) {
              allRidesClosed = false;
              // remember the park's opening hour so we can fill in ride opening times later
              todaysOpeningHour = parkTime.openingTime;
            }
          }

          if (!waittimes.latency || !waittimes.latency.latency) return reject("API didn't return expected format");

          let ridetime;
          for (i = 0, ridetime; ridetime = waittimes.latency.latency[i++];) {
            let rideObject = this.GetRideObject({
              id: ridetime.attractionid,
              // ride name comes from hard-coded AsterixData.json file
              name: (rideData[ridetime.attractionid] && rideData[ridetime.attractionid].title) ? rideData[ridetime.attractionid].title : '??',
            });

            // if park is closed, just mark all rides as closed
            if (allRidesClosed) {
              rideObject = -1;
            } else {
              // FYI, latency = "A L'ARRET" / "INDISPONIBLE" / "FERME" / "X" (mn)
              if (ridetime.latency === "A L'ARRET" || ridetime.latency === 'INDISPONIBLE') {
                rideObject.WaitTime = -2;
              } else if (ridetime.latency === 'FERME') {
                rideObject.WaitTime = -1;
              } else {
                rideObject.waitTime = parseInt(ridetime.latency, 10);

                if (ridetime.closing_time) {
                  const resultRe = reClosingTime.exec(ridetime.closing_time);
                  if (resultRe) {
                    const closingMoment = Moment.tz(this.Timezone).hours(parseInt(resultRe[1])).minutes(parseInt(resultRe[2])).seconds(0);
                    rideObject.Schedule.SetDate({
                      openingTime: todaysOpeningHour,
                      closingTime: closingMoment,
                      type: 'Operating',
                    });
                  }
                }
              }
            }
          }

          resolve();
        }, reject);
      }, reject);
    }));
  }

  FetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      this.HTTP({
        url: `${this[s_apiBase]}03/fr`,
        data: {
          device: 'android',
          version: this[s_appVersion],
          lang: 'fr',
          apiversion: this[s_apiVersion],
        },
      }).then((openingHours) => {
        if (!openingHours.agenda) return reject("API didn't return expected opening hours data");

        for (var i = 0, agenda; agenda = openingHours.agenda[i++];) {
          const date = Moment.tz(agenda.jour, 'DD-MM-YYYY', this.Timezone);

          if (agenda.type === 'D') {
            // park is closed
            this.Schedule.SetDate({
              date,
              type: 'Closed',
            });
          } else if (agenda.type === 'A') {
            var resultRe;
            let firstResult = true;

            while ((resultRe = reTime.exec(agenda.horaire)) !== null) {
              // - Normal time
              this.Schedule.SetDate({
                date,
                openingTime: date.clone().hours(parseInt(resultRe[1])).minutes(0).seconds(0),
                closingTime: (resultRe[2] === 'Minuit') ? date.endOf('day') : date.clone().hours(parseInt(resultRe[2])).minutes(0).seconds(0),
                // can't send type for "special hours"
                type: !firstResult ? null : 'Operating',
                // first result is normal hours, any further dates are special hours
                specialHours: !firstResult,
              });

              // mark that we've parsed one set of opening hours, assume any others are special
              firstResult = false;
            }
          } else {
            this.Log(`Unknown agenda type: ${agenda.type}`);
            continue;
          }
        }

        resolve();
      }, reject);
    }));
  }
}

// export the class
module.exports = AsterixPark;
