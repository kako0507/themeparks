

// web-scraping library for opening dates
const cheerio = require('cheerio');

const crypto = require('crypto');
const moment = require('moment-timezone');

const MerlinPark = require('./legacy');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

// grab JSON park data
const rideNames = {};

function addRideName(obj) {
  // check this is a ride before storing it's name
  let isRide = false;
  if (obj.categories) {
    isRide = obj.categories.some(category => parseInt(category, 10) === 465);
    if (isRide) {
      rideNames[obj.id] = obj.name;
    }
  }
}

// parse ride names from manually extracted JSON file
function parseArea(obj) {
  if (!obj) return;

  if (obj.areas) {
    obj.areas.forEach((area) => {
      addRideName(area);
      parseArea(area);
    });
  }

  if (obj.items) {
    obj.items.forEach((item) => {
      addRideName(item);
      parseArea(item);
    });
  }
}

parseArea(require('./chessingtonworldofadventures_data').areas);

// edge-case: this ride is actually missing from the app, add it manually
if (!rideNames[3958]) {
  rideNames[3958] = 'Penguins of Madagascar Mission: Treetop Hoppers';
}

/**
 * Chessington World Of Adventures
 * @class
 * @extends MerlinPark
 */
class ChessingtonWorldOfAdventures extends MerlinPark {
  static parkName = 'Chessington World Of Adventures';
  static timezone = 'Europe/London';
  static location = new GeoLocation({
    latitude: 51.3496,
    longitude: -0.31457,
  });

  /**
   * The resort ID for legacy API
   * @name ChessingtonWorldOfAdventures.resortId
   * @type {Number}
   */
  static resortId = 44;

  /**
   * The API base URL for the park
   * @name ChessingtonWorldOfAdventures.apiBase
   * @type {String}
   */
  static apiBase = 'https://legacy-api.attractions.io/apps/command/chessington';

  /**
   * The API key for the park
   * @name ChessingtonWorldOfAdventures.apiKey
   * @type {String}
   */
  static apiKey = 'edqXyMWFtuqGY6BZ9Epkzg4ptqe6v3c7tdqa97VbXjvrgZHC';

  static rideNames = rideNames;

  /**
   * Response to challenge request for Chessington World Of Adventures API
   */
  apiRespond(challenge) {
    // this is actually identical to Alton Towers, but the challenge and API Key are swapped around
    return crypto.createHash('md5').update(challenge + this.constructor.apiKey).digest('hex');
  }

  fetchOpeningTimes() {
    return this.fetchOpeningTimesHTML().then(html => this.parseOpeningTimesHTML(html));
  }

  fetchOpeningTimesHTML() {
    return this.http({
      url: 'https://www.chessington.com/plan/chessington-opening-times.aspx',
    });
  }

  parseOpeningTimesHTML(html) {
    const $ = cheerio.load(html);

    $('.day').each((idx, element) => {
      const el = $(element);
      // skip days in the pass
      if (el.hasClass('inactive')) return;

      const hours = {
        dayinfo: el.find('.dayInfo > span').text(),
        opens: el.find('meta[itemprop=opens]').attr('content'),
        closes: el.find('meta[itemprop=closes]').attr('content'),
      };

      // check if the park is open this day (and not just the zoo or such)
      const dayinfo = hours.dayinfo ? hours.dayinfo.toLowerCase() : '';
      // normal opening day
      if (dayinfo.indexOf('theme park') >= 0) {
        this.schedule.setDate({
          openingTime: moment(hours.opens),
          closingTime: moment(hours.closes),
          type: 'Operating',
        });
      }
    });

    return Promise.resolve();
  }
}

module.exports = ChessingtonWorldOfAdventures;
