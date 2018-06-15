

const CedarFairPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Carowinds
 * @class
 * @extends CedarFairPark
 */
class Carowinds extends CedarFairPark {
  static parkName = 'Carowinds';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 35.1045,
    longitude: -80.9394,
  });

  /**
   * The identifier for the park
   * @name Carowinds.parkId
   * @type {String}
   */
  static parkId = 'CF_CA';
}

module.exports = Carowinds;
