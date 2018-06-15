

const SeaworldPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Seaworld Orlando
 * @class
 * @extends SeaworldPark
 */
class SeaworldOrlando extends SeaworldPark {
  static parkName = 'Seaworld Orlando';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.4114,
    longitude: -81.4633,
  });

  /**
   * The identifier for the park
   * @name SeaworldOrlando.parkId
   * @type {String}
   */
  static parkId = 'SW_MCO';
}

module.exports = SeaworldOrlando;
