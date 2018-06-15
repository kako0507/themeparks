const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags Hurricane Harbor, Jackson
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborJackson extends SixFlagsPark {
  static parkName = 'Six Flags Hurricane Harbor, Jackson';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 40.1384,
    longitude: -74.4405,
  });

  /**
   * The identifier for the park
   * @name SixFlagsHurricaneHarborJackson.parkId
   * @type {String}
   */
  static parkId = '23';
}

module.exports = SixFlagsHurricaneHarborJackson;
