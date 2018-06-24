import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags Great America
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsGreatAmerica extends SixFlagsPark {
  static parkName = 'Six Flags Great America';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 42.370244,
    longitude: -87.935916,
  });

  /**
   * The identifier for the park
   * @name SixFlagsGreatAmerica.parkId
   * @type {String}
   */
  static parkId = '7';
}

export default SixFlagsGreatAmerica;
