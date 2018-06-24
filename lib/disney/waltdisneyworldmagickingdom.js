// import the base Disney park class
import DisneyBase from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Walt Disney World Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldMagicKingdom extends DisneyBase {
  static parkName = 'Magic Kingdom - Walt Disney World Florida';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.3852,
    longitude: -81.5639,
  });

  /**
   * The identifier for the park
   * @name WaltDisneyWorldMagicKingdom.parkId
   * @type {String}
   */
  static parkId = '80007944';

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

export default WaltDisneyWorldMagicKingdom;
