import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * La Ronde, Montreal
 * @class
 * @extends SixFlagsPark
 */
class LaRondeMontreal extends SixFlagsPark {
  static parkName = 'La Ronde, Montreal';
  static timezone = 'America/Toronto';
  static location = new GeoLocation({
    latitude: 45.521994,
    longitude: -73.534578,
  });

  /**
   * The identifier for the park
   * @name LaRondeMontreal.parkId
   * @type {String}
   */
  static parkId = '29';
}

export default LaRondeMontreal;
