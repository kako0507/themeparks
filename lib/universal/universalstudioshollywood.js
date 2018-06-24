import UniversalPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Universal Studios Hollywood
 * @class
 * @extends UniversalPark
 */
class UniversalStudiosHollywood extends UniversalPark {
  static parkName = 'Universal Studios Hollywood';
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 34.137261,
    longitude: -118.355516,
  });

  /**
   * The identifier for the park
   * @name UniversalStudiosHollywood.parkId
   * @type {Number}
   */
  static parkId = 13825;

  /**
   * Universal Hollywood also sets the "city" mode
   * @name UniversalStudiosHollywood.parkId
   * @type {String}
   */
  static parkCity = 'hollywood';
}

export default UniversalStudiosHollywood;
