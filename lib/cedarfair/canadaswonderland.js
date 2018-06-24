import CedarFairPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Canada's Wonderland
 * @class
 * @extends CedarFairPark
 */
class CanadasWonderland extends CedarFairPark {
  static parkName = "Canada's Wonderland";
  static timezone = 'America/Toronto';
  static location = new GeoLocation({
    latitude: 43.8430,
    longitude: -79.5390,
  });

  /**
   * The identifier for the park
   * @name CanadasWonderland.parkId
   * @type {String}
   */
  static parkId = 'CF_CW';
}

export default CanadasWonderland;
