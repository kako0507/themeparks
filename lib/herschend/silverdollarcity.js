

// import the base Herschend class
const HerschendBase = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * SilverDollarCity
 * @class
 * @extends HerschendBase
 */
class SilverDollarCity extends HerschendBase {
  static parkName = 'Silver Dollar City';
  static timezone = 'America/Chicago';
  static location = new GeoLocation({
    latitude: 36.668177,
    longitude: -93.338567,
  });

  /**
   * The identifier for the park
   * @name SilverDollarCity.parkId
   * @type {String}
   */
  static parkId = 2;

  /**
   * "parkids" value of Herschend calendar
   * @name SilverDollarCity.parkIds
   * @type {String}
   */
  static parkIds = 'D9044234-6D1E-45C1-82D0-0BE80DA34983';

  /**
   * The calendar URL base for the park
   * @name SilverDollarCity.calendarUrl
   * @type {String}
   */
  static calendarUrl = 'www.silverdollarcity.com';
}

module.exports = SilverDollarCity;
