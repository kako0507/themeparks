import UniversalPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Universal Volcano Bay
 * @class
 * @extends UniversalPark
 */
class UniversalVolcanoBay extends UniversalPark {
  static parkName = 'Universal Volcano Bay';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 28.4623,
    longitude: -81.4707,
  });

  /**
   * The identifier for the park
   * @name UniversalVolcanoBay.parkId
   * @type {Number}
   */
  static parkId = 13801;
}

export default UniversalVolcanoBay;
