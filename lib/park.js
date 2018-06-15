// MomentJS time library
const moment = require('moment-timezone');
// random useragent generator
const randomUseragent = require('random-useragent');

const SocksProxyAgent = require('socks-proxy-agent');
const HttpsProxyAgent = require('https-proxy-agent');

// a basic debug log wrapper
const DebugLog = require('./debugPrint');

// include our Promise library
const Promise = require('./promise');

// load user settings
const settings = require('./settings');

// wrap the HTTP lib for each park so we automatically pass the User-Agent header nicely along
const HTTPLib = require('./http');

// our caching library, each park will get it's own cache object
const CacheLib = require('./cache');

// our Ride object
const Ride = require('./ride');
// our Schedule class
const Schedule = require('./schedule');

// park symbols
const symbolParkTimeFormat = Symbol("park's time format");
const symbolParkDateFormat = Symbol("park's date format");
const symbolUserAgent = Symbol('user agent');
const symbolCacheTimeWaitTimes = Symbol('cache time - wait time');
const symbolCacheTimeOpeningTimes = Symbol('cache time - opening time');
// track which Ride ID is at which index in our Rides array
const symbolRideIdToIdxMap = Symbol('ride ID -> idx map');
// key for our schedule data
const symbolScheduleData = Symbol('schedule data');

// our cache object
const symbolCacheObject = Symbol('cache object');

/**
 * Park class handles all the base logic for all implemented themeparks.
 * All parks should inherit from this base class.
 * Any common functionality is implemented here to save endless re-implementations for each park.
 * @class
 */
class Park {
  /**
   * Create a new Park object
   * @param {Object} options
   * @param {String} [options.timeFormat] Format to display park times in
   * @param {String} [options.dateFormat] Format to display park dates in
   * @param {Number} [options.cacheWaitTimesLength=300]
   *  How long (in seconds) to cache wait times before fetching fresh time
   */
  constructor(options = {}) {
    // can only construct actual parks, not the park object itself
    //  see http://ilikekillnerds.com/2015/06/abstract-classes-in-javascript/
    if (this.constructor === Park) {
      throw new TypeError('Cannot create Park object directly, only park implementations of Park');
    }

    // take base variables from the constructor
    //  these variables should be present for all parks
    // what's up with these OR things?
    //  by default, use any manually passed in options
    //  finally, fallback on the default settings
    this[symbolParkTimeFormat] = options.timeFormat || settings.defaultParkTimeFormat;
    this[symbolParkDateFormat] = options.dateFormat || settings.defaultDateFormat;

    // cache settings
    //  how long wait times are cached before fetching new data
    this[symbolCacheTimeWaitTimes] = options.cacheWaitTimesLength;
    this[symbolCacheTimeOpeningTimes] = options.cacheOpeningTimesLength;

    // validate park's timezone with momentjs
    if (!moment.tz.zone(this.constructor.timezone)) {
      throw new Error(`Invalid timezone ${this.constructor.timezone}`);
    }

    // validate our geolocation object has been created
    if (!this.constructor.location) {
      throw new Error(`No park GeoLocation object created for ${this.constructor.parkName}. Please supply longitude and latitude for this park.`);
    }

    // set useragent, or if no useragent has been set, create a random Android one by default
    this.userAgent = this.constructor.userAgentFilter;

    // initialise the Rides array
    this.rides = [];
    // also initialise our ride ID -> idx map
    this[symbolRideIdToIdxMap] = {};

    // make a new schedule object for storing park opening hours in
    this[symbolScheduleData] = new Schedule({
      timeFormat: this[symbolParkTimeFormat],
      dateFormat: this[symbolParkDateFormat],
    });

    // create cache object for this park
    this[symbolCacheObject] = new CacheLib({
      prefix: this.constructor.parkName,
    });
  }

  /**
   * park's name in a human-readable form
   * @name Park.parkName
   * @type {String}
   */
  static parkName = settings.defaultParkName;
  /**
   * park's timezone
   * @name Park.timezone
   * @type {String}
   */
  static timezone = settings.defaultParkTimezone;
  /**
   * Does this park offer fast-pass services?
   * @name Park.fastPass
   * @type {Boolean}
   */
  static fastPass = false;
  /**
   * Does this park tell you the fast-pass return times?
   * @name Park.fastPassReturnTimes
   * @type {Boolean}
   */
  static fastPassReturnTimes = false;
  /**
   * Does this park offer opening times for rides?
   * @name Park.supportsRideSchedules
   * @type {Boolean}
   */
  static supportsRideSchedules = false;

  /**
   * Days of opening times to return with getOpeningTimes()
   * @name Park.scheduleDays
   * @type {Number}
   */
  static scheduleDays = settings.defaultScheduleDays;

  /**
   * The input function for 'random-useragent' to generate user agent randomly
   * @param {Object} ua - useragent data
   */
  static userAgentFilter = ua => (ua.osName === 'Android');

  /**
   * Get waiting times for rides from this park
   * If the last argument is a function, this will act as a callback.
   *  Callback will call with callback(error, data)
   *  Data will be null if error is present
   * If the last argument is not a function, this will return a Promise.
   */
  getWaitTimes(...args) {
    const callback = args[args.length - 1];
    // if our last argument is a function, use it as a callback
    if (typeof callback === 'function') {
      // translate the promise result into a "classic" callback response
      this.getWaitTimesPromise().then((data) => {
        callback(null, data);
      }, (error) => {
        callback(error);
      });
      return false;
    }
    // otherwise, return a Promise object
    return this.getWaitTimesPromise();
  }

  /**
   * Fetch the ride data for the requested ID.
   * If it doesn't exist, add a new ride to our park's ride set
   * @param {Object} ride - Ride data to apply
   * @param {String} ride.id - Ride's ID
   * @param {String} ride.name - Ride's name
   * @returns {Ride} ride - Newly created (or the existing) Ride object
   */
  getRideObject(ride = {}) {
    let { id } = ride;

    if (id === undefined) {
      this.log('No Ride ID supplied to getRideObject', ride);
      return null;
    }
    if (ride.name === undefined) {
      this.log('No Ride name supplied to getRideObject', ride);
      return null;
    }

    // prepend the park's class name to the ID to attempt to ensure uniqueness
    const className = this.constructor.parkName;
    if (String(id).substr(0, className.length) !== className) {
      id = `${className}_${id}`;
    }

    // check if we don't already have this ride in our data set
    if (this[symbolRideIdToIdxMap][id] === undefined) {
      // new ride! add to our set
      const newRide = new Ride({
        rideId: id,
        rideName: ride.name,
      });

      // add our new ride to our ride list and make an ID mapping
      this.rides.push(newRide);
      this[symbolRideIdToIdxMap][id] = this.rides.length - 1;
    }

    // else, don't worry about it, fail quietly
    // return the already existing ride
    return this.rides[this[symbolRideIdToIdxMap][id]];
  }

  /**
   * Fetch the ride data for the requested ID. If it doesn't exist, returns null
   * @param {Object} ride - Ride data to search for
   * @param {String} ride.id - Ride's ID
   * @returns {Ride} ride - Existing Ride object (or null if it doesn't exist)
   */
  findRideObject(ride = {}) {
    if (!ride) {
      this.log('No Ride Data supplied to findRideObject');
      return null;
    }

    let { id } = ride;

    if (id === undefined) {
      this.log('No Ride ID supplied to findRideObject', ride);
      return null;
    }

    // prepend the park's class name to the ID to attempt to ensure uniqueness
    const className = this.constructor.parkName;
    if (String(id).substr(0, className.length) !== className) {
      id = `${className}_${id}`;
    }

    // check if we have this ride yet
    if (this[symbolRideIdToIdxMap][id] === undefined) {
      return null;
    }

    // return the already existing ride
    return this.rides[this[symbolRideIdToIdxMap][id]];
  }

  /**
   * Get waiting times for rides from this park
   * @returns {Promise}
   */
  getWaitTimesPromise() {
    return new Promise(((resolve, reject) => {
      // do we actually support wait times?
      if (!this.supportsWaitTimes) {
        reject(new Error(`${this.constructor.parkName} doesn't support fetching wait times`));
        return;
      }

      // check our cache first
      this.cache.getCachedValue('waittimes').then((ridedata) => {
        // we have ridedata from the cache! apply over our current ride data
        ridedata.forEach((ride) => {
          // restore ride state from cache
          this.getRideObject(ride).fromJSON(ride);
        });

        // make an array of all the ride states
        const result = this.rides.map(ride => ride.toJSON());
        resolve(result);
      }, (err1) => {
        if (err1) {
          this.log(`Error fetching cached wait times: ${err1}`);
        }

        // cache missing key or the cached data has expired. Fetch new data!
        this.fetchWaitTimes().then(() => {
          // success! the this.rides array should now be populated
          //  cache the Rides array and return result
          const result = this.rides.map(ride => ride.toJSON());

          this.cache.setCachedValue('waittimes', result, {
            // either use the options.cacheWaitTimesLength or the default cache time length
            ttl: this[symbolCacheTimeWaitTimes] || settings.defaultCacheWaitTimesLength,
          }).then(() => {
            resolve(result);
          }, reject);
        }, (err2) => {
          // failed to fetch wait times, reject Promise
          reject(new Error(`Error fetching park wait times: ${err2}`));
        });
      });
    }));
  }

  /**
   * Get opening times for this park
   * If the last argument is a function, this will act as a callback.
   *  Callback will call with callback(error, data)
   *  Data will be null if error is present
   * If the last argument is not a function, this will return a Promise.
   */
  getOpeningTimes(...args) {
    const callback = args[args.length - 1];
    // if our last argument is a function, use it as a callback
    if (typeof callback === 'function') {
      // translate the promise result into a "classic" callback response
      this.getOpeningTimesPromise().then((data) => {
        callback(null, data);
      }, (error) => {
        callback(error);
      });
      return false;
    }
    // otherwise, return a Promise object
    return this.getOpeningTimesPromise();
  }

  /**
   * Get opening times for this park
   * @returns {Promise}
   */
  getOpeningTimesPromise() {
    return new Promise(((resolve, reject) => {
      // do we actually support opening times?
      if (!this.supportsOpeningTimes) {
        reject(new Error(`${this.constructor.parkName} doesn't support fetching opening times`));
        return;
      }

      // check our cache first
      this.cache.getCachedValue('openingtimes').then((openingTimesData) => {
        // restore schedule from cached data
        this[symbolScheduleData].fromJSON(openingTimesData);

        // fetch date range to return
        return resolve(this[symbolScheduleData].getDateRange({
          startDate: moment(),
          endDate: moment().add(this.constructor.scheduleDays, 'days'),
        }));
      }, () => {
        // cache missing key or the cached data has expired. Fetch new data!
        this.fetchOpeningTimes().then(() => {
          // fill in any missing days in the next period as closed
          const endFillDate = moment().tz(this.constructor.timezone).add(this.constructor.scheduleDays + 90, 'days');
          for (let m = moment().tz(this.constructor.timezone); m.isBefore(endFillDate); m.add(1, 'day')) {
            const dateData = this.schedule.getDate({
              date: m,
            });
            if (!dateData) {
              this.schedule.setDate({
                date: m,
                type: 'Closed',
              });
            }
          }

          // resolve with our new schedule data
          resolve(this[symbolScheduleData].getDateRange({
            startDate: moment(),
            endDate: moment().add(this.constructor.scheduleDays, 'days'),
          }));

          // if the data is now dirty, cache it
          if (this[symbolScheduleData].IsDirty) {
            // save schedule data in cache
            this.cache.setCachedValue('openingtimes', this[symbolScheduleData].toJSON(), {
              // either use the options.symbolCacheTimeOpeningTimes or the default cache time length
              ttl: this[symbolCacheTimeOpeningTimes] || settings.defaultCacheOpeningTimesLength,
            }, (err1) => {
              if (err1) {
                // if we error, console out, but don't fail (still return data)
                this.log(`Error setting cache data for ${this.constructor.parkName}`);
              }

              // mark data as no longer dirty (no longer needs caching)
              this[symbolScheduleData].IsDirty = false;
            });
          }
        }, (err2) => {
          // failed to fetch opening times, reject Promise
          reject(new Error(`Error fetching park opening times: ${err2}`));
        });
      });
    }));
  }

  /**
   * Get this park's useragent string for making network requests
   * This is usually randomly generated on object construction
   * @type {String}
   */
  get userAgent() {
    return this[symbolUserAgent];
  }

  /**
   * Set this park's useragent
   * Can set user agent to a defined string or use a generator function
   * (see random-useragent library)
   * @type {string|function}
   */
  set userAgent(useragent = null) {
    if (!useragent) throw new Error('No configuration passed to userAgent setter');

    if (typeof (useragent) === 'function') {
      // generate a useragent using a generator function
      this[symbolUserAgent] = randomUseragent.getRandom(useragent);
    } else if (typeof (useragent) === 'string') {
      // set useragent using supplied static string
      this[symbolUserAgent] = useragent;
    } else {
      throw new Error('Must define either static user agent string or a generator function');
    }
    this.log(`Set useragent to ${this.userAgent}`);
  }

  /**
   * Get park's current time
   * @param {Object} timeFormatObject
   * @param {String} [timeFormatObject.timeFormat] Moment JS format string to format time as
   * @returns {String}
   *  Time as formatted by park's timeformat,
   *  or the default timeformat if set to null
   */
  timeNow({
    timeFormat = null,
  } = {}) {
    // take time right now, convert now into park's timezone and format it
    // format in preferred order of, manually passed in format,
    // park's default time format, or global default time format
    return moment()
      .tz(this.constructor.timezone)
      .format(timeFormat || this[symbolParkTimeFormat] || settings.defaultTimeFormat);
  }

  /**
   * Get park's current date
   * @param {Object} dateFormatObject
   * @param {String} [dateFormatObject.dateFormat] Moment JS format string to format date as
   * @returns {String}
   *  Date as formatted by park's dateFormat,
   *  or the default dateFormat if set to null
   */
  dateNow({
    dateFormat = null,
  } = {}) {
    // we're just calling the timeNow function with a date formate string instead
    return this.timeNow({
      timeFormat: dateFormat || this[symbolParkDateFormat],
    });
  }

  /**
   * Get the park's raw schedule object
   * @returns {Schedule} Schedule object for this park's opening times
   */
  get schedule() {
    return this[symbolScheduleData];
  }

  /**
   * Does this park offer wait time information?
   * @type {Boolean}
   */
  get supportsWaitTimes() {
    // base this logic solely on the presence of a function "fetchWaitTimes" existing
    return this.fetchWaitTimes !== undefined;
  }

  /**
   * Does this park offer opening time information?
   * @type {Boolean}
   */
  get supportsOpeningTimes() {
    // base this logic solely on the presence of a function "fetchOpeningTimes" existing
    return this.fetchOpeningTimes !== undefined;
  }

  /**
   * Make an HTTP request using this park's user agent
   */
  http(options) {
    if (!options) {
      return Promise.reject(new Error('No HTTP options passed!'));
    }

    let agent;

    // Use proxy agent if defined in settings
    if (settings.proxyUrl) {
      if (settings.proxyUrl.startsWith('socks://')) {
        agent = new SocksProxyAgent(settings.proxyUrl, true);
      } else if (settings.proxyUrl.startsWith('https://')) {
        agent = new HttpsProxyAgent(settings.proxyUrl, true);
      }
    }

    // pass on options to HTTP lib
    const headers = options.headers || {};
    return HTTPLib({
      ...options,
      headers: {
        ...headers,
        'User-Agent': headers['User-Agent'] || this.userAgent,
      },
      open_timeout: options.open_timeout || settings.defaultOpenTimeout,
      read_timeout: options.read_timeout || settings.defaultReadTimeout,
      agent: agent || options.agent,
    });
  }

  /**
   * Get the cache object for this park
   * @returns {Cache}
   */
  get cache() {
    return this[symbolCacheObject];
  }

  /**
   * Debug print a message (when NODE_DEBUG=themeparks is set in environment)
   * @param {...*} ToPrint Objects/strings to print
   */
  log(args) {
    return DebugLog(`${this.constructor.parkName}:`, ...args);
  }
}

// export the Park class
module.exports = Park;
