

// include core Park class
const _ = require('lodash');
const Park = require('../park');
const moment = require('moment-timezone');

// uuid generation lib
const uuid = require('uuid/v4');
// zip lib to extract data
const unzip = require('yauzl');

const symbolDataVersion = Symbol('data version');
const symbolDeviceTokenCacheTime = Symbol('cache time of device token');
const symbolUserIDCacheTime = Symbol('cache time of user ID');
const symbolDataCacheTime = Symbol('cache time of data');


// static functions
function readZipFile(zip, file) {
  return new Promise((resolve, reject) => {
    let data = '';
    zip.openReadStream(file, (err, readStream) => {
      if (err) {
        reject(err);
        return;
      }

      readStream.on('data', (chunk) => {
        data += chunk;
      }).on('end', () => {
        // parse JSON data
        try {
          data = JSON.parse(data);
          resolve(data);
        } catch (e) {
          reject(new Error(`JSON parse error extracting ${file.fileName}: ${e}`));
        }
      });
    });
  });
}

/**
 * Implements the Merlin Park API framework.
 * Thorpe Park, Alton Towers, Chessington etc. use this API framework
 * @class
 * @extends Park
 */
class MerlinPark extends Park {
  /**
   * Create new Merlin Object.
   * This object should not be called directly,
   * but rather extended for each of the individual Merlin parks
   * @param {Object} options
   * @param {Number} [options.deviceTokenCachetime=86400000]
   * Time to cache device token, in milliseconds (optional)
   * @param {Number} [options.userIdCachetime=43200000]
   * Time to cache user ID, in milliseconds (optional)
   * @param {Number} [options.dataCachetime=43200000]
   * Time to ride data, in milliseconds (optional)
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // custom API options
    if (!this.constructor.apiKey) throw new Error('Merlin Parks require an API key');
    if (!this.constructor.initialDataVersion) throw new Error('Merlin Parks require an initial data version to fetch ride names');
    this[symbolDataVersion] = this.constructor.initialDataVersion;

    // cache times

    // default: 24 hours
    this[symbolDeviceTokenCacheTime] = options.deviceTokenCachetime || 86400000;
    // default: 12 hours
    this[symbolUserIDCacheTime] = options.userIdCachetime || 43200000;
    // default: 12 hours
    this[symbolDataCacheTime] = options.dataCachetime || 43200000;
  }

  /**
   * The API base URL for the park
   * @name MerlinPark.apiBase
   * @type {String}
   */
  static apiBase = 'https://api.attractions.io/v1/';

  /**
   * The app version for the park
   * @name MerlinPark.appVersion
   * @type {String}
   */
  static appVersion = '1.0.1';

  /**
   * The app build for the park
   * @name MerlinPark.appBuild
   * @type {String}
   */
  static appBuild = '5';

  /**
   * The device ID for the park
   * @name MerlinPark.deviceId
   * @type {String}
   */
  static deviceId = '123';

  /**
   * Where the calendar API is hosted for opening times
   * @name MerlinPark.calendarBase
   * @type {String}
   */
  static calendarBase = 'https://www.thorpepark.com/';

  /**
   * The user agent filter for the park
   * @name MerlinPark.userAgentFilter
   * @type {String}
   */
  static userAgentFilter = 'okhttp/3.2.0';

  fetchWaitTimes() {
    // first, make sure we have our park data (ride names etc.)
    return this.GetParkData().then(rideNames => (
      // fetch wait times
      this.MakeAPICall({
        url: `${this.constructor.apiBase}live-data`,
      }).then((data) => {
        data.entities.Item.records.forEach((ride) => {
          const { _id: id } = ride;
          // apply each wait time data
          const rideObject = this.getRideObject({
            id,
            name: rideNames[id],
          });

          if (!rideObject) {
            this.log(`Failed to find ride with ID ${id}`);
          } else {
            // update ride wait time (wait times are in seconds in this API!)
            rideObject.waitTime = ride.IsOpen ? (ride.QueueTime / 60) : -1;
          }
        });

        return Promise.resolve();
      })
    ));
  }

  /**
   * Get an API token from cache or through registering a new device
   */
  RegisterDevice() {
    // fetch new device token if we haven't already got one in our cache
    return this.cache.wrap(
      'device_token', () =>
        // first, get (or generate) a new user ID
        this.GenerateUserID().then(userId =>
          // request token for further API requests
          this.http({
            url: `${this.constructor.apiBase}installation`,
            method: 'POST',
            data: {
              user_identifier: userId,
              device_identifier: this.constructor.deviceId,
              app_version: this.constructor.appVersion,
              app_build: this.constructor.appBuild,
            },
            headers: {
              'occasio-platform': 'Android',
              'occasio-platform-version': '6.0.1',
              'occasio-app-build': this.constructor.appBuild,
              authorization: `Attractions-Io api-key "${this.constructor.apiKey}"`,
            },
          }).then((data) => {
            if (data && data.token) {
              return Promise.resolve(data.token);
            }

            return Promise.reject(new Error('No data returned'));
          }))
      , this[symbolDeviceTokenCacheTime],
    );
  }

  /**
   * Generate (or fetch a cached) user ID
   */
  GenerateUserID() {
    return this.cache.wrap('user_id', () => {
      // generate new UUID if cache hit fails
      const newUserID = uuid();

      this.log(`Generated new UserID ${newUserID}`);

      return Promise.resolve(newUserID);
    }, this[symbolUserIDCacheTime]);
  }

  /**
   * Get (or fetch new) park data
   */
  GetParkData() {
    return this.cache.wrap(
      'data', () =>
        // fetch fresh/updated data
        this.fetchParkData(this.DataVersion).then((data) => {
          const rideData = _.mapValues(
            _.mapKeys(data.Item, ({ _id: id }) => id),
            item => item.Name,
          );
          return Promise.resolve(rideData);
        })
      , this[symbolDataCacheTime],
    );
  }

  /**
   * Get the latest data version timestamp
   */
  get DataVersion() {
    return this[symbolDataVersion];
  }

  /**
   * Fetch/Sync park data
   * Warning: full sync is ~30MB
   */
  fetchParkData(version) {
    // this is a recursive function, and will keep fetching data
    // until we get no more deltas to resolve
    // note: we should attempt to periodically
    // update the initialVersion to cut down on these requests

    // remember this as the latest version for next fetch
    this[symbolDataVersion] = version;

    // Fetch data
    return this.MakeAPICall({
      url: `${this.constructor.apiBase}data`,
      data: {
        version,
      },
      // we want the full response to get the status code
      returnFullResponse: true,
    }).then((response) => {
      if (response.statusCode === 304) {
        // reject
        this.log(`Reached status 304 accessing data version ${version}`);
        return Promise.reject();
      }
      this.log(`Received data for version ${version}`);

      return new Promise((resolve, reject) => {
        // unzip data
        unzip.fromBuffer(response.body, {
          lazyEntries: true,
        }, (err, zip) => {
          let manifestData;
          let recordsData;

          this.log('Parsing zip file');
          if (err) {
            reject(err);
            return;
          }

          const GetNextEntry = () => {
            if (manifestData && recordsData) {
              // got both the files we need, stop reading the zip file

              // fetch next data URL
              if (manifestData.version) {
                this
                  .fetchParkData(manifestData.version)
                  // as soon as we hit an error, return the current level or records data
                  .catch(() => {
                    resolve(recordsData);
                  });
              } else {
                resolve(recordsData);
              }
            } else {
              // read next entry
              zip.readEntry();
            }
          };

          zip.on('entry', (file) => {
            this.log(`Got zip file ${file.fileName}`);

            // look for the two files we want
            if (file.fileName === 'manifest.json') {
              readZipFile(zip, file).then((data) => {
                manifestData = data;

                GetNextEntry();
              });
            } else if (file.fileName === 'records.json') {
              readZipFile(zip, file).then((data) => {
                recordsData = data;

                GetNextEntry();
              });
            } else {
              GetNextEntry();
            }
          });

          // start reading file...
          zip.readEntry();
        });
      });
    });
  }

  /**
   * Generic API request function, will sort out API token and send auth headers
   * @param {*} options
   * @param {String} options.url URL to access
   * @param {String} [options.method=GET] method to use
   * @param {Object} [options.data={}] data/query string to use
   */
  MakeAPICall(options = {
    method: 'GET',
    data: {},
  }) {
    // get token
    return this.RegisterDevice().then(token => (
      // make API call
      this.http({
        ...options,
        // inject auth headers into request headers
        headers: {
          ...(options.headers || {}),
          authorization: `Attractions-Io api-key "${this.constructor.apiKey}", installation-token="${token}"`,
          'occasio-platform': 'Android',
          'occasio-platform-version': '6.0.1',
          'occasio-app-build': this.constructor.appBuild,
        },
      })
    ));
  }

  fetchOpeningTimes() {
    return new Promise((resolve, reject) => {
      this.http({
        url: `${this.constructor.calendarBase}Umbraco/Api/Calendar/GetAllOpeningTimes`,
        method: 'GET',
        headers: {
          Referer: this.constructor.calendarBase,
          'X-Requested-With': 'XMLHttpRequest',
        },
        json: true,
      }).then((calendarData) => {
        // find theme park dates from response
        //  it contains "WatterPark"[sic] times as well in a separate array
        let parkDates = null;
        if (calendarData[0] && calendarData[0].Type) {
          // for resorts with multiple parks (Alton Towers)
          calendarData.some((times) => {
            if (times.Type === 'ThemePark') {
              parkDates = times.OpeningHours;
              return true;
            }
            return false;
          });
        } else if (calendarData[0].Open) {
          // resorts with only 1 park (Thorpe Park)
          parkDates = calendarData;
        } else {
          reject(new Error('Invalid/Unknown calendar data returned'));
          return;
        }

        let result;
        parkDates.forEach((timeRange) => {
          const range = {
            startDate: moment(timeRange.From, 'YYYY-MM-DDTHH:mm:ss'),
            endDate: moment(timeRange.To, 'YYYY-MM-DDTHH:mm:ss'),
          };

          this.log(`Processing ${range.startDate} => ${range.endDate}`);

          if ((result = /([0-9:]+\s?[ap]m)\s*-\s*([0-9:]+\s?[ap]m)/gi.exec(timeRange.Open.replace(/\./g, ':')))) {
            // figure out opening times for this range
            range.openingTime = moment(result[1].replace(/ /g, ''), 'HH:mma');
            range.closingTime = moment(result[2].replace(/ /g, ''), 'HH:mma');
          } else if ((result = /([0-9]+)\s*-\s*([0-9]+)/gi.exec(timeRange.Open.replace(/\./g, ':')))) {
            // try shorthand format too, in case someone entered the times in badly
            range.openingTime = moment(`${result[1]}:00am`, 'HH:mma');
            range.closingTime = moment(`${result[2]}:00pm`, 'HH:mma');
          } else {
            this.log(`Unable to understand hour format: ${timeRange.Open}`);
            return;
          }

          // apply this range
          this.schedule.setRange(range);
        });
        resolve();
      }, reject);
    });
  }
}

// export the class
module.exports = MerlinPark;
