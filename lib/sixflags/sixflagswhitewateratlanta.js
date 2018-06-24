import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags White Water, Atlanta
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsWhiteWaterAtlanta extends SixFlagsPark {
  static parkName = 'Six Flags White Water, Atlanta';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 33.959128,
    longitude: -84.519548,
  });

  /**
   * The identifier for the park
   * @name SixFlagsWhiteWaterAtlanta.parkId
   * @type {String}
   */
  static parkId = '25';
}

export default SixFlagsWhiteWaterAtlanta;
