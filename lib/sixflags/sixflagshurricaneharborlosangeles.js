const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags Hurricane Harbor, Los Angeles
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborLosAngeles extends SixFlagsPark {
  static parkName = 'Six Flags Hurricane Harbor, Los Angeles';
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 34.42385,
    longitude: -118.595014,
  });

  /**
   * The identifier for the park
   * @name SixFlagsHurricaneHarborLosAngeles.parkId
   * @type {String}
   */
  static parkId = '11';
}

module.exports = SixFlagsHurricaneHarborLosAngeles;
