

// import the base Disney park class
const DisneyBase = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Walt Disney World Hollywood Studios
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldHollywoodStudios extends DisneyBase {
  static parkName = 'Hollywood Studios - Walt Disney World Florida';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.3575,
    longitude: -81.5582,
  });

  /**
   * The identifier for the park
   * @name WaltDisneyWorldHollywoodStudios.parkId
   * @type {String}
   */
  static parkId = '80007998';

  /**
   * The resort ID for the park
   * @name WaltDisneyWorldHollywoodStudios.resortId
   * @type {String}
   */
  static resortId = '80007798';

  /**
   * The region for the park
   * @name WaltDisneyWorldHollywoodStudios.parkRegion
   * @type {String}
   */
  static parkRegion = 'us';

  // WDW doesn't support using the facilities API, so turn this off
  static supportFacilitiesApi = false;
}

module.exports = WaltDisneyWorldHollywoodStudios;
