

const DisneyTokyoPark = require('./index');

const GeoLocation = require('../geoLocation');

/**
 * Tokyo Disney Resort - Magic Kingdom
 * @class
 * @extends DisneyTokyoPark
 */
class TokyoDisneyResortMagicKingdom extends DisneyTokyoPark {
  static parkName = 'Tokyo Disney Resort - Magic Kingdom';
  static location = new GeoLocation({
    latitude: 35.634848,
    longitude: 139.879295,
  });
  static parkKind = 1;
  static locationMin = new GeoLocation({
    latitude: 35.63492433179704,
    longitude: 139.87755417823792,
  });
  static locationMax = new GeoLocation({
    latitude: 35.63234322451754,
    longitude: 139.8831331729889,
  });

  /**
   * The identifier for the park
   * @name TokyoDisneyResortDisneySea.parkId
   * @type {String}
   */
  static parkId = 'tdl';
}

module.exports = TokyoDisneyResortMagicKingdom;
