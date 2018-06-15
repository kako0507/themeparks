const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags Hurricane Harbor, Arlington
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborArlington extends SixFlagsPark {
  static parkName = 'Six Flags Hurricane Harbor, Arlington';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 32.7565,
    longitude: -97.0658,
  });

  /**
   * The identifier for the park
   * @name SixFlagsHurricaneHarborArlington.parkId
   * @type {String}
   */
  static parkId = '10';
}

module.exports = SixFlagsHurricaneHarborArlington;
