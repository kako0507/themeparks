import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags Magic Mountain
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsMagicMountain extends SixFlagsPark {
  static parkName = 'Six Flags Magic Mountain';
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 34.423461,
    longitude: -118.595251,
  });

  /**
   * The identifier for the park
   * @name SixFlagsMagicMountain.parkId
   * @type {String}
   */
  static parkId = '6';
}

export default SixFlagsMagicMountain;
