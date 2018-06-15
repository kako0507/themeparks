

// woah WAT? We're based on the SeaWorld API?
// yep, SeaWorld and Cedar Fair use the same backend API framework for their park wait times
// I didn't realise this for a long time,
// until I checked Knott's Berry Farm and noticed the similarities
// So, to save reimplementing it from scratch,
// I am going to just override a few bits from the SeaWorld implementation

const moment = require('moment-timezone');
// a lenient JSON parser
const relaxedJson = require('relaxed-json');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

const SeaWorld = require('../seaworld/');

// move this outside the class as it's just a convenience class and doens't need to be exposed
const regexLegendTimes = /([0-9]+(?::[0-9]+)?[ap]m)\s*-\s*([0-9]+(?::[0-9]+)?[ap]m)/i;

function ParseOpeningLegend(legendData) {
  const schedule = {};

  // legends are inside two loops. Not totally sure why,
  // but might be a lazy formatting choice for the HTML result
  legendData.forEach((legends) => {
    legends.forEach((legend) => {
      // try to parse times out of description
      const times = regexLegendTimes.exec(legend.description);
      if (times && times[1] && times[2]) {
        schedule[legend.class] = {
          openingTime: moment(`${times[1].toUpperCase()}`, 'H:mA'),
          closingTime: moment(`${times[2].toUpperCase()}`, 'H:mA'),
        };
      }
    });
  });

  return schedule;
}

/**
 * Implements the CedarFairPark API framework.
 * @class
 * @extends SeaWorld
 */
class CedarFairPark extends SeaWorld {
  static parkName = 'Cedar Fair Park';
  static timezone = 'America/Toronto';
  static location = new GeoLocation({
    latitude: 43.8430,
    longitude: -79.5390,
  });

  /**
   * The API base URL for park
   * @name CedarFairPark.apiBase
   * @type {String}
   */
  static apiBase = 'https://cf.te2.biz/rest/';

  /**
   * The Auth Token for the park
   * @name CedarFairPark.apiBase
   * @type {String}
   */
  static authToken = 'Mobile_API:merl4yU2';


  // sadly, the Cedar Fair API doesn't have park hours (it just returns an empty array)
  //  so, let's override it from SeaWorld
  findScheduleDataURL() {
    return this.cache.wrap('schedule_url', () => new Promise(((resolve, reject) => {
      this.getAPIUrl({
        // the park hours URL is kept in the products area
        url: `${this.constructor.apiBase}commerce/${this.constructor.parkId}/products/all`,
      }).then((productData) => {
        // got product data, we're looking for GUEST_PARK_HOURS to get our schedule URL
        const isNotFinished = productData.every((product) => {
          if (product.id === 'GUEST_PARK_HOURS') {
            // this will give us the park-hours.htm document
            //  we want the schedule.js script that contains all the hours data

            // check we're still getting the expected park-hours.htm document
            if (product.purchaseLink.indexOf('park-hours') < 0) {
              reject(new Error('Park hours URL has changed, requires themeparks library update'));
              return false;
            }
            resolve(`${product.purchaseLink.replace(/park-hours[a-zA-Z0-9_-]*\.htm/, '')}js/schedule.js`);
            return false;
          }
          return true;
        });
        if (!isNotFinished) return;

        // failed? search the main venue data instead
        this.getAPIUrl({
          url: `${this.constructor.apiBase}venue/${this.constructor.parkId}`,
        }).then((venueData) => {
          // search venue data
          if (venueData.details) {
            venueData.details.every((detail) => {
              if (detail.id === 'info_web_hours_directions') {
                if (detail.description.indexOf('park-hours') < 0) {
                  reject(new Error('Park hours URL has changed, requires themeparks library update'));
                  return false;
                }
                resolve(`${detail.description.replace(/park-hours[a-zA-Z0-9_-]*\.htm/, '')}js/schedule.js`);
                return false;
              }
              return true;
            });
          }

          reject(new Error('Unable to discover park hours URL'));
        });
      }, reject);
    })), 60 * 60 * 24); // cache URL for 24 hours
  }

  fetchStaticScheduleData() {
    return this.cache.wrap('schedule_data', () => new Promise(((resolve, reject) => {
      this.findScheduleDataURL().then((scheduleURL) => {
        // notice we don't use the API here,
        // this is hosted outside the API,
        // so do a normal API request
        this.http({
          url: scheduleURL,
        }).then((data) => {
          let jsonData;
          const scheduleData = data
            .toString()
            // strip out data around the key JSON object
            // this isn't pretty,
            // but avoids having to manually embed this data into the library,
            // which would be worse

            // remove js var init
            .replace(/var\s+schedule\s*=\s*/, '')
            // remove semi-colon
            .replace(/;/g, '')
            // remove leading non-{ characters
            .replace(/^[^{]+/, '')
            // remove any extra variables after initial one
            .replace(/var[\S\s]*$/mg, '');

          // use our lenient JSON parser
          try {
            jsonData = relaxedJson.parse(scheduleData);
          } catch (e) {
            reject(new Error(`Failed to parse response data from ${this.constructor.parkName} API: ${e}`));
            return;
          }

          if (jsonData) resolve(jsonData);
        }, reject);
      }, reject);
    })), 60 * 60 * 24); // cache for 24 hours
  }

  setOpeningTimes(months, parkHours, specialHours) {
    months.forEach((month) => {
      month.hours.forEach((dayRow) => {
        dayRow.forEach((day) => {
          // skip this entry if there is no day set
          if (!day.day) return;
          // skip this entry if the class doesn't appear in the legend
          if (!parkHours[day.class]) return;

          // figure out this day in the local timezone
          const today = moment.tz({
            day: day.day,
            month: month.index,
            year: month.year,
          }, this.constructor.timezone);

          let dateInfo = {
            date: today,
            // clone today and overwrite the hours from the park legend
            openingTime: today
              .clone()
              .set('hours', parkHours[day.class].openingTime.get('hours'))
              .set('minutes', parkHours[day.class].openingTime.get('minutes')),
            closingTime: today
              .clone()
              .set('hours', parkHours[day.class].closingTime.get('hours'))
              .set('minutes', parkHours[day.class].closingTime.get('minutes')),
            type: 'Operating',
          };

          if (specialHours) {
            dateInfo = {
              ...dateInfo,
              type: specialHours,
              specialHours: true,
            };
          }

          this.schedule.setDate(dateInfo);
        });
      });
    });
  }

  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      // get our schedule data
      this.fetchStaticScheduleData().then((scheduleData) => {
        if (!scheduleData || !scheduleData.main) {
          reject(new Error('Unable to find main schedule data for park'));
          return;
        }

        // parse park legend to figure out possible opening hours
        const mainParkHours = ParseOpeningLegend(scheduleData.main.legend);

        // cycle through main park hours
        this.setOpeningTimes(scheduleData.main.months, mainParkHours);

        // if we have special hours, inject these into main hours
        (this.constructor.specialHours || []).forEach((specialHours) => {
          if (!scheduleData[specialHours]) return;

          const specialLegend = ParseOpeningLegend(scheduleData[specialHours].legend);
          this.setOpeningTimes(scheduleData[specialHours].months, specialLegend, specialHours);
        });

        resolve();
      }, reject);
    }));
  }
}

module.exports = CedarFairPark;
