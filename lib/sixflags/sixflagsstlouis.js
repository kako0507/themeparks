import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags St. Louis
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsStLouis extends SixFlagsPark {
  static parkName = 'Six Flags St. Louis';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 38.513226,
    longitude: -90.675191,
  });

  /**
   * The identifier for the park
   * @name SixFlagsStLouis.parkId
   * @type {String}
   */
  static parkId = '3';
}

export default SixFlagsStLouis;
