// import the base Disney park class
import DisneyBase from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Disneyland Resort - California Adventure
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandResortCaliforniaAdventure extends DisneyBase {
  static parkName = 'California Adventure - Disneyland Resort';
  static timezone = 'America/Los_Angeles';
  static location = new GeoLocation({
    latitude: 33.808720,
    longitude: -117.918990,
  });

  /**
   * The identifier for the park
   * @name DisneylandResortCaliforniaAdventure.parkId
   * @type {String}
   */
  static parkId = '336894';

  /**
   * The resort ID for the park
   * @name DisneylandResortCaliforniaAdventure.resortId
   * @type {String}
   */
  static resortId = '80008297';

  /**
   * The region for the park
   * @name DisneylandResortCaliforniaAdventure.parkRegion
   * @type {String}
   */
  static parkRegion = 'us';

  // override this, as Disneyland Resort supports returning fastPass return times
  static fastPassReturnTimes = true;

  get fetchWaitTimesURL() {
    // override the wait times URL for Disneyland Resort parks!
    return `${this.constructor.apiBase}facility-service/theme-parks/${this.constructor.parkId}/wait-times`;
  }
}

export default DisneylandResortCaliforniaAdventure;
