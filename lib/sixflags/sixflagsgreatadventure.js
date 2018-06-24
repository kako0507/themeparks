import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags Great Adventure
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsGreatAdventure extends SixFlagsPark {
  static parkName = 'Six Flags Great Adventure';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 40.148661,
    longitude: -74.441025,
  });

  /**
   * The identifier for the park
   * @name SixFlagsGreatAdventure.parkId
   * @type {String}
   */
  static parkId = '5';
}

export default SixFlagsGreatAdventure;
