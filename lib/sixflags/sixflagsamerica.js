const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags America
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsAmerica extends SixFlagsPark {
  static parkName = 'Six Flags America';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 38.901238,
    longitude: -76.771276,
  });

  /**
   * The identifier for the park
   * @name SixFlagsAmerica.parkId
   * @type {String}
   */
  static parkId = '14';
}

module.exports = SixFlagsAmerica;
