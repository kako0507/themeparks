// import the base Herschend class
import HerschendBase from './index';

// our simple geolocation object library
import GeoLocation from '../geoLocation';

/**
 * Dollywood
 * @class
 * @extends HerschendBase
 */
class Dollywood extends HerschendBase {
  static parkName = 'Dollywood';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 35.795329,
    longitude: -83.530886,
  });

  /**
   * The identifier for the park
   * @name Dollywood.parkId
   * @type {String}
   */
  static parkId = 1;

  /**
   * "parkids" value of Herschend calendar
   * @name Dollywood.parkIds
   * @type {String}
   */
  static parkIds = 'B31C52D1-0BDE-4494-BAC9-C843C8F25942';

  /**
   * The calendar URL base for the park
   * @name Dollywood.calendarUrl
   * @type {String}
   */
  static calendarUrl = 'www.dollywood.com';
}

export default Dollywood;
