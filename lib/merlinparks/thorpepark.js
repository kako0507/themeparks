import moment from 'moment-timezone';
import MerlinPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Thorpe Park
 * @class
 * @extends MerlinPark
 */
class ThorpePark extends MerlinPark {
  static parkName = 'Thorpe Park';
  static timezone = 'Europe/London';
  static location = new GeoLocation({
    latitude: 51.4055,
    longitude: -0.5105,
  });

  /**
   * The API key for the park
   * @name ThorpePark.apiKey
   * @type {String}
   */
  static apiKey = 'a070eedc-db3a-4c69-b55a-b79336ce723f';

  /**
   * The initial version timestamp to fetch
   * @name ThorpePark.initialDataVersion
   * @type {String}
   */
  static initialDataVersion = '2017-05-24T09:57:13Z';

  /**
   * Where the calendar API is hosted for opening times
   * @name MerlinPark.calendarBase
   * @type {String}
   */
  static calendarBase = 'https://www.thorpepark.com/';

  /**
   * Get the calendar URL
   * @name MerlinPark.calendarUrl
   * @returns {String} calendar URL for the park
   */
  static get calendarUrl() {
    return `${this.calendarBase}Umbraco/Api/Calendar/GetAllOpeningTimes`;
  }

  fetchOpeningTimes() {
    return new Promise((resolve, reject) => {
      this.http({
        url: this.constructor.calendarUrl,
        headers: {
          referer: this.constructor.calendarBase,
          'x-requested-with': 'XMLHttpRequest',
        },
        json: true,
      }).then((parkDates) => {
        if (!parkDates[0].Open) {
          reject(new Error('Invalid/Unknown calendar data returned'));
          return;
        }

        parkDates.forEach((timeRange) => {
          const startDate = moment(timeRange.From, 'YYYY-MM-DDTHH:mm:ss');
          const endDate = moment(timeRange.To, 'YYYY-MM-DDTHH:mm:ss');

          this.log(`Processing ${startDate} => ${endDate}`);

          // apply this range
          this.schedule.setRange({
            startDate,
            endDate,
            ...this.parseOpeningTime(timeRange.Open),
          });
        });
        resolve();
      }, reject);
    });
  }
}

export default ThorpePark;
