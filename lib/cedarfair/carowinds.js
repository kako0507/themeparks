import CedarFairPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Carowinds
 * @class
 * @extends CedarFairPark
 */
class Carowinds extends CedarFairPark {
  static parkName = 'Carowinds';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 35.1045,
    longitude: -80.9394,
  });

  /**
   * The identifier for the park
   * @name Carowinds.parkId
   * @type {String}
   */
  static parkId = 'CF_CA';
}

export default Carowinds;
