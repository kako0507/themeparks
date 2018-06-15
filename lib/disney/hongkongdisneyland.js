

// import the base Disney park class
const DisneyBase = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Hong Kong Disneyland
 * @class
 * @extends WaltDisneyWorldPark
 */
class HongKongDisneyland extends DisneyBase {
  static parkName = 'Hong Kong Disneyland';
  static timezone = 'Asia/Hong_Kong';
  static location = new GeoLocation({
    latitude: 22.3132,
    longitude: 114.0445,
  });

  /**
   * The identifier for the park
   * @name HongKongDisneyland.parkId
   * @type {String}
   */
  static parkId = 'desHongKongDisneyland';

  /**
   * The resort ID for the park
   * @name HongKongDisneyland.resortId
   * @type {String}
   */
  static resortId = 'hkdl';

  /**
   * The region for the park
   * @name HongKongDisneyland.parkRegion
   * @type {String}
   */
  static parkRegion = 'INTL';

  // I've never witnessed the facilities URL actually work in the live app, so disable it
  static supportFacilitiesApi = false;
}

module.exports = HongKongDisneyland;
