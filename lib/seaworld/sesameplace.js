

const SeaworldPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * Sesame Place
 * @class
 * @extends SeaworldPark
 */
class SesamePlace extends SeaworldPark {
  static parkName = 'Sesame Place';
  static timezone = 'America/New_York';
  static location = new GeoLocation({
    latitude: 40.185667,
    longitude: -74.871460,
  });

  /**
   * The identifier for the park
   * @name SesamePlace.parkId
   * @type {String}
   */
  static parkId = 'SP_PHL';

  /**
   * The array of valid ride types.
   * Some implementations of the API use various types to declare rides
   * @name SesamePlace.rideTypes
   * @type {Array}
   */
  static rideTypes = ['Ride', 'DryFun', 'WetFun'];
}

module.exports = SesamePlace;
