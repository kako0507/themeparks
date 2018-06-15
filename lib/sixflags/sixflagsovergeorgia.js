const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags Over Georgia
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsOverGeorgia extends SixFlagsPark {
  static parkName = 'Six Flags Over Georgia';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 33.770579,
    longitude: -84.55149,
  });

  /**
   * The identifier for the park
   * @name SixFlagsOverGeorgia.parkId
   * @type {String}
   */
  static parkId = '2';
}

module.exports = SixFlagsOverGeorgia;
