

// import the base Disney park class
const DisneyBase = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Disneyland Resort - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandResortMagicKingdom extends DisneyBase {
  static parkName = 'Magic Kingdom - Disneyland Resort';
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 33.810109,
    longitude: -117.918971,
  });

  /**
   * The identifier for the park
   * @name DisneylandResortMagicKingdom.parkId
   * @type {String}
   */
  static parkId = '330339';

  /**
   * The resort ID for the park
   * @name DisneylandResortMagicKingdom.resortId
   * @type {String}
   */
  static resortId = '80008297';

  /**
   * The region for the park
   * @name DisneylandResortMagicKingdom.parkRegion
   * @type {String}
   */
  static parkRegion = 'us';

  // override this, as Disneyland Resort supports returning fastPass return times
  static fastPassReturnTimes = true;

  get fetchWaitTimesURL() {
    // override the wait times URL for Disneyland Resort parks!
    return `${this.constructor.apiBase}facility-service/theme-parks/${this.constructor.parkId}/wait-times`;
  }
}

module.exports = DisneylandResortMagicKingdom;
