import CedarFairPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * KingsIsland
 * @class
 * @extends CedarFairPark
 */
class KingsIsland extends CedarFairPark {
  static parkName = 'Kings Island';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 39.3447,
    longitude: -84.2686,
  });

  /**
   * The identifier for the park
   * @name KingsIsland.parkId
   * @type {String}
   */
  static parkId = 'CF_KI';
}

export default KingsIsland;
