

const SeaworldPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Busch Gardens - Tampa Bay
 * @class
 * @extends SeaworldPark
 */
class BuschGardensTampaBay extends SeaworldPark {
  static parkName = 'Busch Gardens - Tampa Bay';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.033594,
    longitude: -82.420700,
  });

  /**
   * The identifier for the park
   * @name BuschGardensTampaBay.parkId
   * @type {String}
   */
  static parkId = 'BG_TPA';
}

module.exports = BuschGardensTampaBay;
