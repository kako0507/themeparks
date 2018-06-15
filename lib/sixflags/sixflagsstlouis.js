const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags St. Louis
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsStLouis extends SixFlagsPark {
  static parkName = 'Six Flags St. Louis';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 38.513226,
    longitude: -90.675191,
  });

  /**
   * The identifier for the park
   * @name SixFlagsStLouis.parkId
   * @type {String}
   */
  static parkId = '3';
}

module.exports = SixFlagsStLouis;
