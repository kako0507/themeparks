const symbolLongitude = Symbol('longitude');
const symbolLatitude = Symbol('latitude');

/**
 * Format a decimal number to [Int]\u00B0 [Remainder]\u2032
 * @private
 * @returns {String} Formatted string representing this number in XX° YY′ ZZ″
 * */
function formatNumberToGeoLocation(number) {
  // work out minutes and seconds for this input
  const locationMinutes = Math.floor((number % 1) * 60);
  const locationSeconds = (((number * 60) % 1) * 60).toFixed(2);

  // return formatted string
  return `${Math.floor(number)}\u00B0${locationMinutes}\u2032${locationSeconds}\u2033`;
}

/**
 * GeoLocation class to store theme park locations and supply helper functions
 * @class
 */
class GeoLocation {
  /**
   * @param {Object} location
   * @param {Number} location.longitude - New location's longitude
   * @param {Number} location.latitude - New location's latitude
   */
  constructor({
    longitude = 0,
    latitude = 0,
  }) {
    this[symbolLongitude] = parseFloat(longitude);
    this[symbolLatitude] = parseFloat(latitude);

    // validate longitude and latitude
    if (this[symbolLongitude] === undefined || typeof (this[symbolLongitude]) !== 'number') {
      throw new Error(`Invalid/Undefined value for longitude: ${this[symbolLongitude]}`);
    }
    if (this[symbolLatitude] === undefined || typeof (this[symbolLatitude]) !== 'number') {
      throw new Error(`Invalid/Undefined value for latitude: ${this[symbolLatitude]}`);
    }

    // wrap longitude and latitude around so they are in a standard format for us to use
    //  longitude should be between -180,180
    this[symbolLongitude] = this[symbolLongitude] % 360;
    if (this[symbolLongitude] > 180) this[symbolLongitude] -= 360;

    // latitude should be clamped between -90,90
    // (if we go too far north, we don't want to wrap around to the south)
    this[symbolLatitude] = Math.max(-90, Math.min(this[symbolLatitude], 90));
  }

  /**
   * Return a random point between two GeoLocation objects
   * @returns {GeoLocation} New GeoLocation object randomly set between locationA and locationB
   */
  static randomBetween(locationA, locationB) {
    return new GeoLocation({
      longitude: (
        locationA.longitudeRaw +
        (Math.random() * (locationB.longitudeRaw - locationA.longitudeRaw))
      ),
      latitude: (
        locationA.latitudeRaw +
        (Math.random() * (locationB.latitudeRaw - locationA.latitudeRaw))
      ),
    });
  }

  /**
   * Return the formatted longitude for this location
   * Formatted as XX°YY′ZZ″
   * @type {String}
   */
  get longitude() {
    if (this[symbolLongitude] < 0) {
      return `${formatNumberToGeoLocation(-this[symbolLongitude])}W`;
    }
    return `${formatNumberToGeoLocation(this[symbolLongitude])}E`;
  }

  /**
   * Return the raw numeric value of this position's longitude
   * @type {Number}
   */
  get longitudeRaw() {
    return this[symbolLongitude];
  }

  /**
   * Return the formatted latitude for this location
   * Formatted as XX°YY′
   * @type {String}
   */
  get latitude() {
    if (this[symbolLatitude] < 0) {
      return `${formatNumberToGeoLocation(-this[symbolLatitude])}S`;
    }
    return `${formatNumberToGeoLocation(this[symbolLatitude])}N`;
  }

  /**
   * Return the raw numeric value of this position's latitude
   * @type {Number}
   */
  get latitudeRaw() {
    return this[symbolLatitude];
  }

  /**
   * Return this GeoLocation safe for printing
   * @returns {String} Location String formatted as: ([latitude], [longitude])
   */
  toString() {
    return `(${this.latitude}, ${this.longitude})`;
  }

  /*
   * Return this GeoLocation in JSON format
   * @returns {Object} Location Object formatted
   */
  toJSON() {
    return {
      latitude: this.latitude,
      longitude: this.longitude,
    };
  }

  /**
   * Return a URL to this park on Google Maps
   * @returns {String} URL to this park on Google Maps
   */
  toGoogleMaps() {
    return `http://maps.google.com/?ll=${this.latitudeRaw},${this.longitudeRaw}`;
  }
}

export default GeoLocation;
