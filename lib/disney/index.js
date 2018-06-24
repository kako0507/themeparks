// moment date/time library
import moment from 'moment-timezone';
// base Disney World park objects
import Park from '../park';
// we're storing ride locations now, so include our location lib
import GeoLocation from '../geoLocation';
// need schedule lib to store ride times
import Schedule from '../schedule';
// include our Promise library
import Promise from '../promise';

// Disney API configuration keys
const symbolRideSchedules = Symbol('ride schedules');
const symbolScheduleFilters = Symbol('schedule filters');

// API settings
const accessTokenURL = 'https://authorization.go.com/token';
const accessTokenURLBody = 'grant_type=assertion&assertion_type=public&client_id=WDPRO-MOBILE.MDX.WDW.ANDROID-PROD';
const accessTokenURLMethod = 'POST';
const appID = 'WDW-MDX-ANDROID-3.4.1';
const baseURL = 'https://api.wdpro.disney.go.com/';

const regexTidyID = /^([^;]+)/;
/**
 * Clean up a WDW ride id
 * IDs are usually in form [id];entityType=Attraction
 * This will tidy that up to just return the numeric ID portion at the start
 * @private
 */
function cleanRideId(rideId) {
  const capture = regexTidyID.exec(rideId);
  if (capture && capture.length > 1) {
    return capture[1];
  }
  return rideId;
}

const unsupportFacilitiesPromise = () => Promise.resolve({});

/**
 * Implements the Walt Disney World API framework. All Disney parks use this one API.
 * @class
 * @extends Park
 */
class WaltDisneyWorldPark extends Park {
  /**
   * Create new WaltDisneyWorldPark Object.
   * This object should not be called directly,
   * but rather extended for each of the individual Disney parks
   * @param {Object} options
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // grab disney API configuration settings (or throw an error if value is missing/null)
    if (!this.constructor.resortId) throw new Error("Missing park's resort ID");
    if (!this.constructor.parkId) throw new Error("Missing park's API ID");
    if (!this.constructor.parkRegion) throw new Error("Missing park's region");

    // valid ride types to return
    if (
      !Array.isArray(this.constructor.rideTypes) &&
      this.constructor.rideTypes !== undefined
    ) {
      throw new Error('rideTypes should be an array');
    }

    // schedule filters
    if (
      !Array.isArray(this.constructor.scheduleFilters) &&
      this.constructor.scheduleFilters !== undefined
    ) {
      throw new Error('scheduleFilters should be an array');
    }
    this[symbolScheduleFilters] = [
      ...(this.constructor.scheduleFilters || []),
      // always return attractions
      'Attraction',
    ];

    // store ride schedules separately and apply them when needed
    this[symbolRideSchedules] = {};
  }

  static parkName = 'Walt Disney World Resort';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.3852,
    longitude: -81.5639,
  });

  // override ride schedule getter to state this park supports ride schedules
  static supportsRideSchedules = true;

  static supportFacilitiesApi = true;
  // the Auth URL for the park
  static authURL = accessTokenURL;
  // the Auth body used for requesting the auth token
  static authString = accessTokenURLBody;
  /**
   * Override fastPass to declare support for fast pass
   * @name WaltDisneyWorldPark.fastPass
   * @type {Boolean}
   */
  static fastPass = true;

  /**
   * The API base URL for the park
   * @name WaltDisneyWorldPark.apiBase
   * @type {String}
   */
  static apiBase = baseURL;

  /**
   * The array of valid ride types.
   * Some implementations of the API use various types to declare rides
   * @name WaltDisneyWorldPark.rideTypes
   * @type {Array}
   */
  static rideTypes = ['Attraction'];

  /**
   * The schedule filters for the park
   * @name WaltDisneyWorldPark.apiBase
   * @type {String}
   */
  static scheduleFilters = ['theme-park'];

  /**
   * Get our current access token
   */
  getAccessToken() {
    let expiresIn;
    return this.cache.wrap('accesstoken', () => new Promise(((resolve, reject) => {
      // request a fresh access token
      this.http({
        url: this.constructor.authURL,
        method: accessTokenURLMethod,
        body: this.constructor.authString,
        // Disney API doesn't want to return as application/JSON,
        // so we'll manually parse it into a nice object
        forceJSON: true,
      }).then((body) => {
        if (!body.access_token) {
          this.log('Error body', body);
          return reject(new Error('Returned access token data missing access_token'));
        }
        if (!body.expires_in) {
          this.log('Error body', body);
          return reject(new Error('Returned access token data missing expires_in'));
        }

        // parse expires_in into an int
        const ttlExpiresIn = parseInt(body.expires_in, 10);

        // The ttlExpiresIn is the maximum time the access_token is valid.
        // It's possible for the token to be given back just moments before
        // it is invalid. Therefore we should force the ttl value in the
        // cache lower than this value so requests don't fail.
        expiresIn = Math.ceil(ttlExpiresIn * 0.90);

        this.log(`Fetched new WDW access_token ${body.access_token}, expires in ${body.expires_in}, caching for a maximum of ${expiresIn}`);

        // return our new access token
        return resolve(body.access_token);
      }, reject);
    })), () => expiresIn);
  }

  /**
   * Fetch a URL from the Disney API
   */
  getAPIUrl(requestObject) {
    return new Promise(((resolve, reject) => {
      // get access token
      this.getAccessToken().then((accessToken) => {
        // TODO - build request object
        // make sure headers exist if they weren't set already
        const headers = requestObject.headers || {};

        // send network request
        this.http({
          ...requestObject,
          headers: {
            ...headers,
            Authorization: `BEARER ${accessToken}`,
            Accept: 'application/json;apiversion=1',
            'X-Conversation-Id': 'WDPRO-MOBILE.MDX.CLIENT-PROD',
            'X-App-Id': appID,
            'X-Correlation-ID': Date.now(),
          },
          // make sure we get JSON back
          forceJSON: true,
        }).then(resolve, reject);
      }, reject);
    }));
  }

  /**
   * Fetch this Disney Park's waiting times
   * @returns {Promise}
   */
  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      // fetch opening times before wait times (so we have opening times to inject into rides)
      this.getOpeningTimes().then(() => {
        // fetch wait times URL
        this.getAPIUrl({
          url: this.fetchWaitTimesURL,
          // pass in park region also
          data: {
            region: this.constructor.parkRegion,
          },
        }).then(
          // success!
          (waitTimeData) => {
            // check we have some data
            if (!waitTimeData || !waitTimeData.entries) {
              this.log('Error data', waitTimeData || 'null');
              reject(new Error('Invalid data returned by WDW API for fetchWaitTimes'));
              return;
            }


            let getFacilitiesDataPromise;
            if (this.constructor.supportFacilitiesApi) {
              getFacilitiesDataPromise = this.getFacilitiesData();
            } else {
              getFacilitiesDataPromise = unsupportFacilitiesPromise();
            }
            // fetch facilities data to inject locations (coming soon) and fastPass availability
            getFacilitiesDataPromise.then((facilitiesData) => {
              // apply each ride wait time
              waitTimeData.entries.forEach((ride) => {
                // skip any ride without a name, likely an invalid ride
                // eg. the River Rogue Keelboats at DLP are dormant and invalid,
                // but still have a ride object with no name
                if (!ride.name) {
                  return;
                }

                // only keep actual attractions
                if (this.constructor.rideTypes.indexOf(ride.type) < 0) {
                  return;
                }

                const rideId = cleanRideId(ride.id);

                // get the ride object for this ride (will create it if it doesn't exist)
                const rideObject = this.getRideObject({
                  id: rideId,
                  name: ride.name,
                });

                const rideStatus = (ride.waitTime && ride.waitTime.status) ? ride.waitTime.status.toLowerCase() : '';
                if (rideStatus === 'down') {
                  rideObject.waitTime = -2;
                } else if (rideStatus === 'operating') {
                  rideObject.waitTime = ride.waitTime.postedWaitMinutes || 0;
                } else {
                  rideObject.waitTime = ride.waitTime.postedWaitMinutes || -1;
                }

                // set fastpass status from facilities data
                if (facilitiesData[rideId]) {
                  rideObject.fastPass = facilitiesData[rideId]
                    ? facilitiesData[rideId].fastPass
                    : false;
                } else {
                  // no facilities data? fallback on live fastPass availability
                  rideObject.fastPass = !!(ride.waitTime && (
                    // check for both fastpass and fastPass
                    (ride.waitTime.fastpass && ride.waitTime.fastpass.available) ||
                    (ride.waitTime.fastPass && ride.waitTime.fastPass.available)
                  ));
                }

                // some Disney parks return fastpass return times! search them out
                if (ride.waitTime && ride.waitTime.fastPass) {
                  if (!ride.waitTime.fastPass.available) {
                    rideObject.fastPassReturnTimeAvailable = false;
                  } else if (ride.waitTime.fastPass.startTime && ride.waitTime.fastPass.endTime) {
                    // we have start and end return times! convert to moment objects and set
                    rideObject.fastPassReturnTimeStart = moment.tz(ride.waitTime.fastPass.startTime, 'HH:mm:ss', this.constructor.timezone);
                    rideObject.fastPassReturnTimeEnd = moment.tz(ride.waitTime.fastPass.endTime, 'HH:mm:ss', this.constructor.timezone);
                  }
                }

                // apply any schedule data we've fetched from opening hour data
                if (this[symbolRideSchedules][rideId]) {
                  const endFillDate = moment.tz(this.constructor.timezone).add(90, 'days');
                  for (let m = moment.tz(this.constructor.timezone); m.isBefore(endFillDate); m.add(1, 'day')) {
                    const rideScheduleData = this[symbolRideSchedules][rideId].getDate({
                      date: m,
                    });
                    if (rideScheduleData) {
                      rideObject.schedule.setDate(rideScheduleData);
                    }
                  }
                }
              });

              return resolve();
            });
          },
          // error
          reject,
        );
      }, reject);
    }));
  }

  /**
   * Fetch this Disney Park's opening times
   * @returns {Promise}
   */
  fetchOpeningTimes() {
    return new Promise(((resolve, reject) => {
      // get today's date and add on a month to get a decent range of dates
      const rangeStart = moment.tz(this.constructor.timezone).format('YYYY-MM-DD');
      const rangeEnd = moment.tz(this.constructor.timezone).add(30, 'days').format('YYYY-MM-DD');

      this.getAPIUrl({
        url: this.FetchScheduleTimesURL,
        data: {
          filters: this[symbolScheduleFilters].join(','),
          startDate: rangeStart,
          endDate: rangeEnd,
          region: this.constructor.parkRegion,
        },
      }).then((scheduleData) => {
        if (!scheduleData || !scheduleData.activities) {
          this.log(`Missing activities from ${scheduleData}`);
          reject(new Error('Missing activities data from opening times API'));
          return;
        }

        // parse each schedule entry
        scheduleData.activities.forEach((schedule) => {
          // skip if we're missing valid schedule data
          if (!schedule.schedule) return;

          const scheduleID = cleanRideId(schedule.id);
          schedule.schedule.schedules.forEach((scheduleTime) => {
            const newScheduleData = {
              date: moment.tz(scheduleTime.date, 'YYYY-MM-DD', schedule.timeZone || this.constructor.timezone),
              openingTime: moment.tz(`${scheduleTime.date}T${scheduleTime.startTime}`, 'YYYY-MM-DDTHH:mm:ss', schedule.timeZone || this.constructor.timezone),
              closingTime: moment.tz(`${scheduleTime.date}T${scheduleTime.endTime}`, 'YYYY-MM-DDTHH:mm:ss', schedule.timeZone || this.constructor.timezone),
              type: scheduleTime.type,
              // work out if these are special hours or not
              specialHours: (
                scheduleTime.type !== 'Operating' &&
                scheduleTime.type !== 'Closed' &&
                scheduleTime.type !== 'Refurbishment'
              ),
            };

            // check if we've found the actual park's schedule
            if (scheduleID === this.constructor.parkId) {
              // apply data to our schedule
              this.schedule.setDate(newScheduleData);
            } else {
              // else, we must be a ride! (or event/parade or something)

              // remember ride schedules and apply them when fetchWaitTimes is called
              if (!this[symbolRideSchedules][scheduleID]) {
                this[symbolRideSchedules][scheduleID] = new Schedule();
              }

              this[symbolRideSchedules][scheduleID].setDate(newScheduleData);
            }
          });
        });

        resolve();
      }, reject);
    }));
  }

  /**
   * Get park facilities data
   * Gives us data like whether a ride offers fastPass and their geo-location
   */
  getFacilitiesData() {
    // cache facilities data for 24 hours (this fetches all data for the resort,
    // so cache at a resort level with a global wrap)
    return this.cache.wrapGlobal(
      `${this.constructor.resortId}_facilities`, () =>
        // fetch fresh facilities data
        this.getAPIUrl({
          url: this.FetchFacilitiesURL,
          method: 'POST',
        }).then((data) => {
          const facilitiesData = {};

          data.added.forEach((element) => {
            if (element.type !== 'Attraction') return;

            // grab ride coordinates (there will be likely multiple)
            const coordinates = [];
            element.relatedLocations.forEach((location) => {
              location.coordinates.forEach((coordinate) => {
                // each ride can have multiple locations
                //  think: railway, fastPass entrance etc.

                let locationName = coordinate.type.trim();

                // calculate name for this location
                if (locationName === 'Guest Entrance') {
                  // we have a "Guest Entrance",
                  // rather than calling it that,
                  // use the name of this location
                  // this helps for rides with multiple "Guest Entrance"s like the railroad
                  locationName = location.name.trim();
                }

                const geoLoc = new GeoLocation({
                  longitude: coordinate.longitude,
                  latitude: coordinate.latitude,
                });

                coordinates.push({
                  location: geoLoc,
                  name: locationName,
                });
              });
            });

            // add this attraction to our collected data
            facilitiesData[cleanRideId(element.id)] = {
              name: element.name.trim(),
              locations: coordinates,
              // hilariously some parks call is "fastPass" and some "fastPassPlus"
              fastPass: element.fastPass && element.fastPass === 'true'
                ? true
                : (!!(element.fastPassPlus && element.fastPassPlus === 'true')),
            };
          });

          return Promise.resolve(facilitiesData);
        }, Promise.reject)
      , 60 * 60 * 24,
    );
  }

  /**
   * The URL used to request this park's latest ride waiting times
   * @type {String}
   */
  get fetchWaitTimesURL() {
    // this is a separate function for any parks that need to override this
    return `${this.constructor.apiBase}facility-service/theme-parks/${this.constructor.parkId};destination\u003d${this.constructor.resortId}/wait-times`;
  }

  /**
   * The URL used to request this park's schedule data
   * @type {String}
   */
  get FetchScheduleTimesURL() {
    return `${this.constructor.apiBase}mobile-service/public/ancestor-activities-schedules/${this.constructor.resortId};entityType=destination`;
  }

  /**
   * The URL used to request the park's facilities data
   * @type {String}
   */
  get FetchFacilitiesURL() {
    return `${this.constructor.apiBase}mobile-service/public/destinations/${this.constructor.resortId};entityType\u003ddestination/facilities?region=${this.constructor.parkRegion}`;
  }
}

// export just the Base Disney Park class
export default WaltDisneyWorldPark;
