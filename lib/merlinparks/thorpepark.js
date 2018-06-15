

const MerlinPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

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
}

module.exports = ThorpePark;
