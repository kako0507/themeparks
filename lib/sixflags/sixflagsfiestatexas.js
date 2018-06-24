import SixFlagsPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Six Flags Fiesta Texas
 * @class
 * @extends SixFlagsPark
 */
class SixFlagsFiestaTexas extends SixFlagsPark {
  static parkName = 'Six Flags Fiesta Texas';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 29.599801,
    longitude: -98.609028,
  });

  /**
   * The identifier for the park
   * @name SixFlagsFiestaTexas.parkId
   * @type {String}
   */
  static parkId = '8';
}

export default SixFlagsFiestaTexas;
