

const SeaworldPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Busch Gardens - Williamsburg
 * @class
 * @extends SeaworldPark
 */
class BuschGardensWilliamsburg extends SeaworldPark {
  static parkName = 'Busch Gardens - Williamsburg';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 37.237225,
    longitude: -76.645128,
  });

  /**
   * The identifier for the park
   * @name BuschGardensTampaBay.parkId
   * @type {String}
   */
  static parkId = 'BG_PHF';
}

module.exports = BuschGardensWilliamsburg;
