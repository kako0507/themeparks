import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags Discovery Kingdom
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsDiscoveryKingdom extends SixFlagsPark {
  static parkName = 'Six Flags Discovery Kingdom';
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 38.13873,
    longitude: -122.23325,
  });

  /**
   * The identifier for the park
   * @name SixFlagsDiscoveryKingdom.parkId
   * @type {String}
   */
  static parkId = '17';
}

export default SixFlagsDiscoveryKingdom;
