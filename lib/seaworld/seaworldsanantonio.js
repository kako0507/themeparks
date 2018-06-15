

const SeaworldPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Seaworld San Antonio
 * @class
 * @extends SeaworldPark
 */
class SeaworldSanAntonio extends SeaworldPark {
  static parkName = 'Seaworld San Antonio';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 29.458490,
    longitude: -98.699848,
  });

  /**
   * The identifier for the park
   * @name SeaworldSanAntonio.parkId
   * @type {String}
   */
  static parkId = 'SW_SAT';
}

module.exports = SeaworldSanAntonio;
