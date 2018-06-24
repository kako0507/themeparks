import _ from 'lodash';
import moment from 'moment-timezone';
// cookie library for reading geocookie for wait times
import cookie from 'cookie';
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

  /**
   * Refresh/Fetch new Wait Times for this Tokyo Disney Resort park
   * @returns {Promise}
   */
  fetchWaitTimes() {
    // fetch wait times HTML page
    return this.fetchWaitTimesURL().then(data => (
      // parse HTML data
      this.parseWaitTimesJSON(data).then((rideTimes) => {
        rideTimes.forEach((ride) => {
          const rideObject = this.getRideObject({
            id: ride.id,
            name: ride.name,
          });

          if (rideObject) {
            rideObject.waitTime = ride.waitTime;
            rideObject.fastPass = ride.fastPass;
            if (ride.fastPassReturnTimeStart) {
              rideObject.fastPassReturnTimeStart = ride.fastPassReturnTimeStart;
            }
            if (ride.fastPassReturnTimeEnd) {
              rideObject.fastPassReturnTimeEnd = ride.fastPassReturnTimeEnd;
            }
          }
        });
        return Promise.resolve();
      })));
  }

  fetchWaitTimesURL() {
    return this.getAcccessToken().then(accessToken => this.http({
      url: `https://www.tokyodisneyresort.jp/_/realtime/${this.constructor.parkId}_attraction.json`,
      headers: {
        Cookie: `tdrloc=${encodeURIComponent(accessToken)}`,
        connection: 'keep-alive',
      },
      retryDelay: 1000 * 10,
    }));
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

  /**
   * Get the Geo-Locked access token for accessing Tokyo Disneyland wait times
   * @returns {Promise<String>} tdrloc cookie needed for accessing wait time pages
   */
  getAcccessToken() {
    let cookieExpire;
    return this.cache.wrap(
      'geocookie', () => new Promise(((resolve, reject) => {
        // generate a new geo cookie for accessing Tokyo ride data
        const randomGeoLocation = GeoLocation.randomBetween(
          this.constructor.locationMin,
          this.constructor.locationMax,
        );

        this.http({
          method: 'GET',
          url: `https://www.tokyodisneyresort.jp/${this.constructor.parkId}/realtime.html?nextUrl=${this.constructor.parkId}attraction`,
          headers: {
            connection: 'keep-alive',
          },
          retryDelay: 1000 * 10,
        }).then((pageResp) => {
          // extract blockId and pageBlockId from page HTML
          const pageRegex = /blockId=([0-9]+)&pageBlockId=([0-9]+)/;
          const match = pageRegex.exec(pageResp);

          if (!match) {
            reject(new Error('Unable to extract blockId and pageBlockId from Tokyo Disneyland page'));
            return;
          }

          // request cookie for accessing wait times using a random location in the park
          this.http({
            method: 'POST',
            url: `https://www.tokyodisneyresort.jp/view_interface.php?nextUrl=${this.constructor.parkId}attraction&blockId=${match[1]}&pageBlockId=${match[2]}`,
            data: {
              lat: randomGeoLocation.latitudeRaw,
              lon: randomGeoLocation.longitudeRaw,
            },
            headers: {
              connection: 'keep-alive',
              Referer: `https://www.tokyodisneyresort.jp/${this.constructor.parkId}/realtime`,
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'X-Requested-With': 'XMLHttpRequest',
              Origin: 'https://www.tokyodisneyresort.jp',
            },
            // don't actually follow the redirect, we just want the cookie
            follow_max: 0,
            // we are actually only interested in the headers,
            // so get the full response, not the body
            returnFullResponse: true,
            retryDelay: 1000 * 10,
          }).then((resp) => {
            if (resp.body && resp.body.result === false) {
              reject(new Error('Tokyo Disney Resort failed our location test'));
              return;
            }

            if (
              resp &&
              resp.headers &&
              resp.headers['set-cookie'] &&
              resp.headers['set-cookie'].length
            ) {
              // hunt for the tdrloc cookie
              let GPSCookie;
              let GPSExpiresIn = 60 * 30;
              resp.headers['set-cookie'].forEach((cookieString) => {
                const cookieData = cookie.parse(cookieString);

                // search for any tdrloc cookie
                // keep searching and keep the last set one
                // their server usually sets it twice,
                // first deleting it, then setting the correct one
                if (cookieData && cookieData.tdrloc) {
                  GPSCookie = cookieData.tdrloc;
                  // parse cookie date to calculate expirey time in seconds
                  GPSExpiresIn = moment().diff(moment(cookieData.expires, 'ddd, DD-MMM-YYYY HH:mm:ss z'), 'seconds');

                  // the cookie can actually be negative if the park is closed (weird, but OK)
                  // if this is so, keep the current one for 5 minutes and try again
                  if (GPSExpiresIn < 0) {
                    GPSExpiresIn = 60 * 5;
                  }
                }
              });

              // did we find the cookie?
              if (GPSCookie) {
                // set out-of-scope cookieExpire
                // so we can tell the cache how long to keep this token
                // take a little off to be safe (a minute)
                cookieExpire = GPSExpiresIn - 60;

                this.log(`Fetched new TDR geo-cookie: ${GPSCookie}`);

                // return the new cookie
                resolve(GPSCookie);
              } else {
                reject(new Error('Failed to find GPS Cookie from TDR website'));
              }
            } else {
              reject(new Error('Missing GeoCookie from TDR response'));
            }
          }, reject);
        });
      })),
      () => cookieExpire,
    );
  }

  /**
   * Fetch English ride names from the API
   * @returns {Promise<Object>} `ride ID` to English names
   */
  getRideNames() {
    return this.cache.wrap('ridenames', () => new Promise(((resolve, reject) => {
      // fetch ride names
      this.http({
        url: `http://www.tokyodisneyresort.jp/api/v1/wapi_attractions/lists/sort_type:1/locale:1/park_kind:${this.constructor.parkKind}/`,
        forceJSON: true,
        headers: {
          Referer: `http://www.tokyodisneyresort.jp/en/attraction/lists/park:${this.constructor.parkId}`,
          connection: 'keep-alive',
        },
        retryDelay: 1000 * 10,
      }).then((body) => {
        if (!body || !body.entries || !body.entries.length) {
          reject(new Error('Failed to find entries in ride data response'));
        }

        // populate data
        const rideData = _.mapKeys(
          body.entries.map(ride => ride.name || ride.name_yomi),
          ride => ride.str_id,
        );

        resolve(rideData);
      }, reject);
    })), 86400);
  }
}

export default DisneyTokyoPark;
