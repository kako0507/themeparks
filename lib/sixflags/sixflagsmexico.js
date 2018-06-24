import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags México
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsMexico extends SixFlagsPark {
  static parkName = 'Six Flags México';
  static timezone = 'America/Mexico_City';
  static location = new GeoLocation({
    latitude: 19.295389,
    longitude: -99.211442,
  });

  /**
   * The identifier for the park
   * @name SixFlagsMexico.parkId
   * @type {String}
   */
  static parkId = '28';
}

export default SixFlagsMexico;
