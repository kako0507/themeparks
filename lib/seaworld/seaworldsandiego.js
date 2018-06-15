

const SeaworldPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Seaworld San Diego
 * @class
 * @extends SeaworldPark
 */
class SeaworldSanDiego extends SeaworldPark {
  static parkName = 'Seaworld San Diego';
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 32.764302,
    longitude: -117.226441,
  });

  /**
   * The identifier for the park
   * @name SeaworldSanDiego.parkId
   * @type {String}
   */
  static parkId = 'SW_SAN';
}

module.exports = SeaworldSanDiego;
