const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Six Flags Hurricane Harbor, Oaxtepec
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsHurricaneHarborOaxtepec extends SixFlagsPark {
  static parkName = 'Six Flags Hurricane Harbor, Oaxtepec';
  static timezone = 'America/Mexico_City';
  static location = new GeoLocation({
    latitude: 18.8967,
    longitude: -98.9754,
  });

  /**
   * The identifier for the park
   * @name SixFlagsHurricaneHarborOaxtepec.parkId
   * @type {String}
   */
  static parkId = '32';
}

module.exports = SixFlagsHurricaneHarborOaxtepec;
