

// import the base Disney park class
const DisneyBase = require('./index.js');

/**
 * Disneyland Paris - Magic Kingdom
 * @class
 * @extends WaltDisneyWorldPark
 */
class DisneylandParisMagicKingdom extends DisneyBase {
  /**
     * Create a new DisneylandParisMagicKingdom object
     */
  constructor(options = {}) {
    options.name = options.name || 'Magic Kingdom - Disneyland Paris';
    options.timezone = options.timezone || 'Europe/Paris';

    // set park's location as it's entrance
    options.latitude = options.latitude || 48.870321;
    options.longitude = options.longitude || 2.779672;

    // Disney API configuration for Disneyland Paris Magic Kingdom
    options.resort_id = options.resort_id || 'dlp';
    options.park_id = options.park_id || 'P1';
    options.park_region = options.park_region || 'fr';

    // inherit from base class
    super(options);
  }
}

module.exports = DisneylandParisMagicKingdom;
