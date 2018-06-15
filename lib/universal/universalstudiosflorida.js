

const UniversalPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Universal Studios Florida
 * @class
 * @extends UniversalPark
 */
class UniversalStudiosFlorida extends UniversalPark {
  static parkName = 'Universal Studios Florida';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.4749822,
    longitude: -81.4664970,
  });

  /**
   * The identifier for the park
   * @name UniversalStudiosFlorida.parkId
   * @type {Number}
   */
  static parkId = 10010;
}

module.exports = UniversalStudiosFlorida;
