import cheerio from 'cheerio';
import moment from 'moment-timezone';
// include core Park class
import Park from '../park';
import GeoLocation from '../geoLocation';

/**
 * Implements the Universal Singapore API.
 * @class
 * @extends Park
 */
class UniversalStudiosSingapore extends Park {
  static parkName = 'Universal Studios Singapore';
  static timezone = 'Asia/Singapore';
  static location = new GeoLocation({
    latitude: 1.254251,
    longitude: 103.823797,
  });

  static locationMin = new GeoLocation({
    latitude: 1.2547872658731591,
    longitude: 103.8217341899872,
  });
  static locationMax = new GeoLocation({
    latitude: 1.2533177673892697,
    longitude: 103.82408380508424,
  });

  static apiLangauge = 1;

  /**
   * The API base URL for the park
   * @name UniversalStudiosSingapore.apiBase
   * @type {String}
   */
  static apiBase = 'http://cma.rwsentosa.com/Service.svc/GetUSSContent';

  static calendarUrl = 'https://www.rwsentosa.com/en/attractions/universal-studios-singapore/plan-your-visit';

  /**
   * Fetch Universal Singapore's waiting times
   * @returns {Promise}
   */
  fetchWaitTimes() {
    return new Promise((resolve, reject) => {
      // generate random geo location to fetch with
      const randomGeoLocation = GeoLocation.randomBetween(
        this.constructor.locationMin,
        this.constructor.locationMax,
      );

      this.log('Running Universal Studios Singapore');
      this.http({
        url: this.constructor.apiBase,
        data: {
          languageID: this.constructor.apiLangauge,
          filter: 'Ride',
          Latitude: randomGeoLocation.latitudeRaw,
          Longitude: randomGeoLocation.longitudeRaw,
        },
      }).then((xml) => {
        const $ = cheerio.load(xml);
        $('Result>USSZoneList>USSZone').each((idx1, zone) => {
          $(zone).find('Content>USSContent').each((idx2, ride) => {
            const rideContent = $(ride);
            const rideObject = this.getRideObject({
              id: rideContent.find('USSContentID').text(),
              name: rideContent.find('Name').text(),
            });
            rideObject.waitTime = rideContent.find('Availability').text() === 'True'
              ? (parseInt(rideContent.find('QueueTime').text(), 10) || -1)
              : -1;
          });
        });

        resolve();
      }, reject);
    });
  }

  // TODO: implement this function
  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      this.http({
        url: this.constructor.calendarUrl,
      }).then((html) => {
        const $ = cheerio.load(html);
        const months = $('.date-switch.mth-3 span')
          .map((idx, element) => {
            const elem = $(element);
            return moment(elem.text(), 'MMMM YYYY').tz(this.constructor.timezone);
          })
          .get()
          .filter(date => date.isValid);
        $('table.calendar-table').each((idx1, element1) => {
          const table = $(element1);
          table.find('td.day>div').each((idx2, element2) => {
            const day = $(element2);
            const eventsElem = day.find('.events');
            if (!eventsElem.text()) {
              return;
            }
            const dayString = day.html().split('<')[0].trim();
            const events = eventsElem.html().split('<br>');

            events.forEach((event, eventIdx) => {
              const scheduleDate = moment(months[idx1]).date(dayString);
              if (eventIdx === 0) {
                const openingTimeSplit = event.split('-');
                this.schedule.setDate({
                  date: scheduleDate,
                  openingTime: moment.tz(
                    `${scheduleDate.format('YYYY-MM-DD')} ${openingTimeSplit[0]}`,
                    'YYYY-MM-DD HHA',
                    this.constructor.timezone,
                  ),
                  closingTime: moment.tz(
                    `${scheduleDate.format('YYYY-MM-DD')} ${openingTimeSplit[1]}`,
                    'YYYY-MM-DD HHA',
                    this.constructor.timezone,
                  ),
                });
                return;
              }

              const openingTimeSplit = event.split(':');
              const scheduleType = openingTimeSplit[0];
              const scheduleHour = moment.tz(
                `${scheduleDate.format('YYYY-MM-DD')} ${openingTimeSplit[1]}`,
                'YYYY-MM-DD HHA',
                this.constructor.timezone,
              );
              this.schedule.setDate({
                date: scheduleDate,
                openingTime: scheduleHour,
                closingTime: scheduleHour,
                type: scheduleType,
                specialHours: true,
              });
            });
          });
        });
        resolve();
      }, reject);
    }));
  }
}

// export the class
export default UniversalStudiosSingapore;
