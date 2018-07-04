import _ from 'lodash';
import moment from 'moment-timezone';
import randomUseragent from 'random-useragent';

import cheerio from 'cheerio';
import Park from '../park';
import GeoLocation from '../geoLocation';

/**
 * Implements the Tokyo Disneyland API framework.
 * @class
 * @extends Park
 */
class DisneyTokyoPark extends Park {
  /**
   * Create new DisneyTokyoPark Object.
   * This object should not be called directly,
   * but rather extended for each of the individual Tokyo Disneyland parks
   * @param {Object} options
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // assign park configurations
    if (!this.constructor.parkId) throw new Error("Missing park's API ID");
    if (!this.constructor.parkKind) throw new Error("Missing park's kind ID");

    // geoip range for generating valid cookie
    //  specify as two Location points
    if (
      !this.constructor.locationMin ||
      !(this.constructor.locationMin instanceof GeoLocation)
    ) {
      throw new Error("Missing park's min location");
    }
    if (
      !this.constructor.locationMax ||
      !(this.constructor.locationMax instanceof GeoLocation)
    ) {
      throw new Error("Missing park's max location");
    }
  }

  static parkName = 'Tokyo Disneyland Park';
  static timezone = 'Asia/Tokyo';

  /**
   * Override fastPass to declare support for fast pass
   * @name DisneyTokyoPark.fastPass
   * @type {Boolean}
   */
  static fastPass = true;

  static apiKey = '818982cd6a62e7927700a4fbabcd4534a4657a422711a83c725433839b172371';
  static apiAuth = 'MmYyZDYzehoVwD52FWYyDvo22aGvetu6uaGGKdN6FILO9lp2XS17DF//BA+Gake8oJ0GKlGnJDWu/boVa32d7PfCeTqCJA==';
  static apiOs = 'Android 8.1.0';
  static apiVersion = '1.0.2';
  static apiBase = 'https://api-portal.tokyodisneyresort.jp';

  static webUserAgent = randomUseragent.getRandom(ua => ua.osName === 'Android');

  getApiHeaders() {
    return {
      connection: 'Keep-Alive',
      'x-api-key': this.constructor.apiKey,
      'x-portal-app-version': this.constructor.apiVersion,
      'x-portal-auth': this.constructor.apiAuth,
      'x-portal-language': 'ja',
      'x-portal-os-version': this.constructor.apiOs,
    };
  }

  getEnglishNames() {
    return this.cache.wrap('ridenames', () => (
      // fetch ride names
      this.http({
        url: `https://www.tokyodisneyresort.jp/en/${this.constructor.parkId}/attraction.html`,
        headers: {
          connection: 'Keep-Alive',
          referer: `https://www.tokyodisneyresort.jp/en/${this.constructor.parkId}/attraction.html`,
          'user-agent': this.constructor.webUserAgent,
        },
        retryDelay: 1000 * 10,
      }).then((html) => {
        if (!html) {
          return Promise.reject(new Error('Failed to find entries in English ride names data response'));
        }

        const $ = cheerio.load(html);
        const linkPrefix = `/en/${this.constructor.parkId}/attraction/detail/`;

        let rideData = _.mapKeys(
          $(`li>a[href^="${linkPrefix}"]`)
            .map((index, rideHtml) => {
              const a = $(rideHtml);
              const p = $(rideHtml).prev();
              const name = a.find('.heading3');
              return {
                id: a.attr('href').split(linkPrefix)[1].split('/')[0],
                area: $(p).text(),
                name: $(name).text(),
              };
            })
            .get(),
          ride => ride.id,
        );

        // add area name to any duplicate names
        const nameCounts = _.countBy(rideData, ride => ride.name);
        rideData = _.mapValues(rideData, (ride) => {
          if (nameCounts[ride.name] > 1) {
            return {
              ...ride,
              name: `${ride.area} ${ride.name}`,
            };
          }
          return ride;
        });

        // missing facility 245 from scrape?
        if (rideData[244] && !rideData[245]) {
          rideData = {
            ...rideData,
            245: rideData[244],
          };
        }

        return Promise.resolve(rideData);
      })
    ), 86400);
  }

  fetchRideData() {
    return this.cache.wrap('ridedata', async () => {
      // first get our English ride names
      const englishNames = await this.getEnglishNames();
      // fetch ride data from App API
      const body = await this.http({
        url: `${this.constructor.apiBase}/rest/v1/facilities`,
        headers: this.getApiHeaders(),
      });

      if (!body) {
        return Promise.reject(new Error('Failed to find entries in ride data response'));
      }

      const rideData = _.mapValues(
        _.mapKeys(
          body.attractions.filter(attr => (
            attr.parkType.toLowerCase() === this.constructor.parkId
          )),
          attr => attr.id,
        ),
        (attr) => {
          const englishData = englishNames[Number(attr.facilityCode)];
          return {
            name: englishData && englishData.name !== undefined
              ? englishData.name
              : attr.nameKana,
            fastpass: !!attr.fastpass,
            type: attr.attractionType.id,
            facilityCode: Number(attr.facilityCode),
          };
        },
      );

      return Promise.resolve(rideData);
    }, 86400);
  }

  /**
   * Refresh/Fetch new Wait Times for this Tokyo Disney Resort park
   * @returns {Promise}
   */
  fetchWaitTimes() {
    // fetch wait times HTML page
    return this.fetchRideData().then(rides => (
      this.http({
        url: `${this.constructor.apiBase}/rest/v1/facilities/conditions`,
        headers: this.getApiHeaders(),
      }).then((data) => {
        data.attractions.forEach((ride) => {
          // skip any rides we don't recognise
          const rideInfo = rides[ride.id];
          if (!rideInfo) return;
          // skip rides with no wait time service
          if (ride.standbyTimeDisplayType === 'FIXED') return;
          // skip anything not type 1 or 2 (rides and shows)
          if (rideInfo.type >= 3) return;

          const rideObject = this.getRideObject({
            id: ride.id,
            name: rideInfo.name,
          });

          rideObject.FastPass = rideInfo.fastpass;

          if (ride.operatingStatus === 'CLOSE_NOTICE') {
            // ride is temporarily closed
            rideObject.WaitTime = -2;
          } else if (ride.facilityStatus === 'CANCEL') {
            // ride is closed for the day
            rideObject.WaitTime = -1;
          } else if (ride.operatingStatus === 'OPEN') {
            rideObject.WaitTime = (
              ride.standbyTime !== undefined &&
              ride.standbyTime >= 0
            )
              ? ride.standbyTime
              : 0;
          } else {
            rideObject.WaitTime = -1;
          }
        });

        return Promise.resolve();
      })
    ));
  }

  parseWaitTimesJSON(data) {
    const rides = data.map((rideData) => {
      const facilityStatus = Number(rideData.FacilityStatusCD);
      const operatingStatus = Number(rideData.OperatingStatusCD);

      // default ride status - current standby time
      let rideStatus = Number(rideData.StandbyTime);
      if (Number.isNaN(rideStatus)) rideStatus = -1;

      // some rides don't show wait times, default to 0
      if (!rideData.UseStandbyTimeStyle) {
        rideStatus = 0;
      }

      if (facilityStatus === 2 || operatingStatus === 2) {
        // 1 means "closed" for the day
        rideStatus = -1;
      } else if (
        facilityStatus === 3 ||
        facilityStatus === 4 ||
        operatingStatus === 3 ||
        operatingStatus === 4
      ) {
        // status of 3 or 4 means "closed"
        rideStatus = -1;
      } else if (operatingStatus === 5 || facilityStatus === 5) {
        // status of 5 means "down"
        rideStatus = -2;
      } else if (operatingStatus === 6 || facilityStatus === 6) {
        // status 6 means "closed" unless you have a fastPass (it's right at the end of the day)
        rideStatus = -1;
      }

      const ride = {
        id: Number(rideData.FacilityID),
        name: rideData.FacilityName,
        waitTime: rideStatus,
        // does ride support fastPass? (and does it have any left?)
        fastPass: !!((rideData.FsStatus && rideData.FsStatusflg)),
        // TODO: separate "has fastpass" and "any fastpass left?"
      };

      // process any found fastpass return times
      if (
        rideData.FsStatus && rideData.FsStatusflg &&
        rideData.FsStatusStartTime !== null &&
        rideData.FsStatusEndTime !== null) {
        // we have start and end return times! convert to moment objects and set
        ride.fastPassReturnTimeStart = moment.tz(rideData.FsStatusStartTime, 'HH:mm', this.constructor.timezone);
        ride.fastPassReturnTimeEnd = moment.tz(rideData.FsStatusEndTime, 'HH:mm', this.constructor.timezone);
      }
      return ride;
    });

    return Promise.resolve(rides);
  }

  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      const { parkId } = this.constructor;
      this.http({
        url: `https://www.tokyodisneyresort.jp/en/${parkId}`,
      }).then((html) => {
        const $ = cheerio.load(html);

        $('td[id^="caldate-"]').each((idx, element) => {
          const elem = $(element);
          const openingTime = elem.attr(`data-${parkId[parkId.length - 1]}-open_org`);
          const closingTime = elem.attr(`data-${parkId[parkId.length - 1]}-close_org`);
          if (!openingTime || !closingTime) {
            return;
          }
          const scheduleDate = moment(elem.attr('data-ymd'), 'YYYY/MM/DD');
          this.schedule.setDate({
            date: scheduleDate,
            openingTime: moment.tz(
              `${scheduleDate.format('YYYY-MM-DD')} ${openingTime}`,
              'YYYY-MM-DD HH:mm',
              this.constructor.timezone,
            ),
            closingTime: moment.tz(
              `${scheduleDate.format('YYYY-MM-DD')} ${closingTime}`,
              'YYYY-MM-DD HH:mm',
              this.constructor.timezone,
            ),
          });
        });
        resolve();
      }, reject);
    }));
  }
}

export default DisneyTokyoPark;
