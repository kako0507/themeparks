import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags New England
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsNewEngland extends SixFlagsPark {
  static parkName = 'Six Flags New England';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 42.037929,
    longitude: -72.615532,
  });

  /**
   * The identifier for the park
   * @name SixFlagsNewEngland.parkId
   * @type {String}
   */
  static parkId = '20';
}

export default SixFlagsNewEngland;
