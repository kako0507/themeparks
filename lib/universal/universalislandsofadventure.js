

const UniversalPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Universal's Islands Of Adventure
 * @class
 * @extends UniversalPark
 */
class UniversalIslandsOfAdventure extends UniversalPark {
  static parkName = "Universal's Islands Of Adventure";
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.4722430,
    longitude: -81.4678556,
  });

  /**
   * The identifier for the park
   * @name UniversalIslandsOfAdventure.parkId
   * @type {Number}
   */
  static parkId = 10000;
}

module.exports = UniversalIslandsOfAdventure;
