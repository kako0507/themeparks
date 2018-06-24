// import the base Disney park class
import DisneyBase from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Walt Disney World Animal Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class WaltDisneyWorldAnimalKingdom extends DisneyBase {
  static parkName = 'Animal Kingdom - Walt Disney World Florida';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.3553,
    longitude: -81.5901,
  });

  /**
   * The identifier for the park
   * @name WaltDisneyWorldAnimalKingdom.parkId
   * @type {String}
   */
  static parkId = '80007823';

  /**
   * The resort ID for the park
   * @name WaltDisneyWorldAnimalKingdom.resortId
   * @type {String}
   */
  static resortId = '80007798';

  /**
   * The region for the park
   * @name WaltDisneyWorldAnimalKingdom.parkRegion
   * @type {String}
   */
  static parkRegion = 'us';

  // WDW doesn't support using the facilities API, so turn this off
  static supportFacilitiesApi = false;
}

export default WaltDisneyWorldAnimalKingdom;
