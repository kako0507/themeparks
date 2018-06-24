// import the base Disney park class
import DisneyBase from './index';
// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Disneyland Paris - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandParisMagicKingdom extends DisneyBase {
  static parkName = 'Magic Kingdom - Disneyland Paris';
  static timezone = 'Europe/Paris';
  static location = new GeoLocation({
    latitude: 48.870321,
    longitude: 2.779672,
  });

  /**
   * The identifier for the park
   * @name DisneylandParisMagicKingdom.parkId
   * @type {String}
   */
  static parkId = 'P1';

  /**
   * The resort ID for the park
   * @name DisneylandParisMagicKingdom.resortId
   * @type {String}
   */
  static resortId = 'dlp';

  /**
   * The region for the park
   * @name DisneylandParisMagicKingdom.parkRegion
   * @type {String}
   */
  static parkRegion = 'fr';
}

export default DisneylandParisMagicKingdom;
