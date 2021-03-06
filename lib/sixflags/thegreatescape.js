import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * The Great Escape
 * @class
 * @extends SixFlagsPark
 */
class TheGreatEscape extends SixFlagsPark {
  static parkName = 'The Great Escape';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 43.3505,
    longitude: -73.69225,
  });

  /**
   * The identifier for the park
   * @name TheGreatEscape.parkId
   * @type {String}
   */
  static parkId = '24';
}

export default TheGreatEscape;
