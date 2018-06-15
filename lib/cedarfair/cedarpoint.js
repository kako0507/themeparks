

const CedarFairPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Cedar Point
 * @class
 * @extends CedarFairPark
 */
class CedarPoint extends CedarFairPark {
  static parkName = 'Cedar Point';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 41.4784,
    longitude: -82.6793,
  });

  /**
   * The identifier for the park
   * @name CedarPoint.parkId
   * @type {String}
   */
  static parkId = 'CF_CP';
}

module.exports = CedarPoint;
