import CedarFairPark from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Knott's Berry Farm
 * @class
 * @extends CedarFairPark
 */
class KnottsBerryFarm extends CedarFairPark {
  static parkName = "Knott's Berry Farm";
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 33.8442,
    longitude: -117.9986,
  });

  /**
   * The identifier for the park
   * @name KnottsBerryFarm.parkId
   * @type {String}
   */
  static parkId = 'CF_KBF';

  // cedar parks have special hours under unique categories
  //  example: scary farm is listed as a separate parkId
  // so we need to list these here so we can combine them into our schedule data as "special hours"

  /**
   * Array of park IDs to combine with main park for special hours (eg. scaryfarm)
   * @name KnottsBerryFarm.specialHours
   * @type {String[]}
   */
  static specialHours = ['scaryfarm'];
}

export default KnottsBerryFarm;
