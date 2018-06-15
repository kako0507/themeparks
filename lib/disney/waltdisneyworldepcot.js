

// import the base Disney park class
const DisneyBase = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Walt Disney World Epcot
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldEpcot extends DisneyBase {
  static parkName = 'Epcot - Walt Disney World Florida';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.3747,
    longitude: -81.5494,
  });

  /**
   * The identifier for the park
   * @name WaltDisneyWorldEpcot.parkId
   * @type {String}
   */
  static parkId = '80007838';

  /**
   * The resort ID for the park
   * @name WaltDisneyWorldEpcot.resortId
   * @type {String}
   */
  static resortId = '80007798';

  /**
   * The region for the park
   * @name WaltDisneyWorldEpcot.parkRegion
   * @type {String}
   */
  static parkRegion = 'us';

  // WDW doesn't support using the facilities API, so turn this off
  static supportFacilitiesApi = false;
}

module.exports = WaltDisneyWorldEpcot;
