// import the base Disney park class
import DisneyBase from './index';

// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Disneyland Paris - Walt Disney Studios
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandParisWaltDisneyStudios extends DisneyBase {
  static parkName = 'Walt Disney Studios - Disneyland Paris';
  static timezone = 'Europe/Paris';
  static location = new GeoLocation({
    latitude: 48.868271,
    longitude: 2.780719,
  });

  /**
   * The identifier for the park
   * @name DisneylandParisWaltDisneyStudios.parkId
   * @type {String}
   */
  static parkId = 'P2';

  /**
   * The resort ID for the park
   * @name DisneylandParisWaltDisneyStudios.resortId
   * @type {String}
   */
  static resortId = 'dlp';

  /**
   * The region for the park
   * @name DisneylandParisWaltDisneyStudios.parkRegion
   * @type {String}
   */
  static parkRegion = 'fr';
}

export default DisneylandParisWaltDisneyStudios;
