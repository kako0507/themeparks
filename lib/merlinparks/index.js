import _ from 'lodash';
import moment from 'moment-timezone';
// uuid generation lib
import uuid from 'uuid/v4';
// zip lib to extract data
import unzip from 'yauzl';
// include core Park class
import Park from '../park';

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
   * The user agent filter for the park
   * @name MerlinPark.userAgentFilter
   * @type {String}
   */
  static userAgentFilter = 'okhttp/3.2.0';

  /**
   * Parse hour from String to Moment
   * @name MerlinPark.parseHour
   * @param {String} hourString
   * @return {Moment}
   */
  static parseHour(hourString) {
    return moment.tz(hourString, 'HH:mma', this.timezone);
  }

  fetchWaitTimes() {
    // first, make sure we have our park data (ride names etc.)
    return this.getParkData().then(rideNames => (
      // fetch wait times
      this.makeAPICall({
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
  registerDevice() {
    // fetch new device token if we haven't already got one in our cache
    return this.cache.wrap(
      'device_token', () =>
        // first, get (or generate) a new user ID
        this.generateUserID().then(userId =>
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
  generateUserID() {
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
  getParkData() {
    return this.cache.wrap(
      'data', () =>
        // fetch fresh/updated data
        this.fetchParkData(this.dataVersion).then((data) => {
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
  get dataVersion() {
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
    return this.makeAPICall({
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
  makeAPICall(options = {
    method: 'GET',
    data: {},
  }) {
    // get token
    return this.registerDevice().then(token => (
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

  parseOpeningTime(openingTimeString) {
    let result;
    switch (openingTimeString) {
      case 'Closed':
        return {
          type: 'Closed',
        };
      case 'Scarefest':
      case 'Fireworks':
        return {
          type: openingTimeString,
          specialHours: true,
          openingTime: this.constructor.parseHour('00:00'),
          closingTime: this.constructor.parseHour('00:00'),
        };
      default:
    }
    if ((result = /([0-9:]+\s?[ap]m)\s*-\s*([0-9:]+\s?[ap]m)/gi.exec(openingTimeString.replace(/\./g, ':')))) {
      // figure out opening times for this range
      return {
        openingTime: this.constructor.parseHour(result[1].replace(/ /g, '')),
        closingTime: this.constructor.parseHour(result[2].replace(/ /g, '')),
      };
    } else if ((result = /([0-9]+)\s*-\s*([0-9]+)/gi.exec(openingTimeString.replace(/\./g, ':')))) {
      // try shorthand format too, in case someone entered the times in badly
      return {
        openingTime: this.constructor.parseHour(`${result[1]}:00am`),
        closingTime: this.constructor.parseHour(`${result[2]}:00pm`),
      };
    }
    this.log(`Unable to understand hour format: ${openingTimeString}`);
    return false;
  }
}

// export the class
export default MerlinPark;
