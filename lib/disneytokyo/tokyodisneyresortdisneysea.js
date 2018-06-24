import DisneyTokyoPark from './index';
import GeoLocation from '../geoLocation';

/**
 * Tokyo Disney Resort - Disney Sea
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortDisneySea extends DisneyTokyoPark {
  static parkName = 'Tokyo Disney Resort - Disney Sea';
  static location = new GeoLocation({
    latitude: 35.627055,
    longitude: 139.889097,
  });
  static parkKind = 2;
  static locationMin = new GeoLocation({
    latitude: 35.6277563214705,
    longitude: 139.8811161518097,
  });
  static locationMax = new GeoLocation({
    latitude: 35.62465172824325,
    longitude: 139.88948464393616,
  });

  /**
   * The identifier for the park
   * @name TokyoDisneyResortDisneySea.parkId
   * @type {String}
   */
  static parkId = 'tds';
}

export default TokyoDisneyResortDisneySea;
