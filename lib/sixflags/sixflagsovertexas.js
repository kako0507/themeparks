const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags Over Texas
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsOverTexas extends SixFlagsPark {
  static parkName = 'Six Flags Over Texas';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 32.754985,
    longitude: -97.070369,
  });

  /**
   * The identifier for the park
   * @name SixFlagsOverTexas.parkId
   * @type {String}
   */
  static parkId = '1';
}

module.exports = SixFlagsOverTexas;
