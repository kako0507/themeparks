

// import the base Disney park class
const DisneyBase = require('./index');

// we're storing ride locations now, so include our location lib
const GeoLocation = require('../geoLocation');

/**
 * Shanghai Disney Resort - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class ShanghaiDisneyResortMagicKingdom extends DisneyBase {
  static parkName = 'Magic Kingdom - Shanghai Disney Resort';
  static timezone = 'Asia/Shanghai';
  static location = new GeoLocation({
    latitude: 31.1433,
    longitude: 121.6580,
  });

  /**
   * The identifier for the park
   * @name ShanghaiDisneyResortMagicKingdom.parkId
   * @type {String}
   */
  static parkId = 'desShanghaiDisneyland';

  /**
   * The resort ID for the park
   * @name ShanghaiDisneyResortMagicKingdom.resortId
   * @type {String}
   */
  static resortId = 'shdr';

  /**
   * The region for the park
   * @name ShanghaiDisneyResortMagicKingdom.parkRegion
   * @type {String}
   */
  static parkRegion = 'cn';

  // override API URLs to use the Shanghai services
  // (facilities data doesn't work for Shanghai using normal WDW URLs?)
  static authURL = 'https://authorization.shanghaidisneyresort.com/curoauth/v1/token';
  static authString = 'grant_type=assertion&assertion_type=public&client_id=DPRD-SHDR.MOBILE.ANDROID-PROD';

  /**
   * The API base URL for the park
   * @name ShanghaiDisneyResortMagicKingdom.apiBase
   * @type {String}
   */
  static apiBase = 'https://apim.shanghaidisneyresort.com/';
}

module.exports = ShanghaiDisneyResortMagicKingdom;
