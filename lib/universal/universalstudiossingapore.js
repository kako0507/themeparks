// include core Park class
const Park = require('../park');

const GeoLocation = require('../geoLocation');

/**
 * Implements the Universal Singapore API.
 * @class
 * @extends Park
 */
class UniversalStudiosSingapore extends Park {
  static parkName = 'Universal Studios Singapore';
  static timezone = 'Asia/Singapore';
  static location = new GeoLocation({
    latitude: 1.254251,
    longitude: 103.823797,
  });

  static locationMin = new GeoLocation({
    latitude: 1.2547872658731591,
    longitude: 103.8217341899872,
  });
  static locationMax = new GeoLocation({
    latitude: 1.2533177673892697,
    longitude: 103.82408380508424,
  });

  static apiLangauge = 1;

  /**
   * The API base URL for the park
   * @name UniversalStudiosSingapore.apiBase
   * @type {String}
   */
  static apiBase = 'http://cma.rwsentosa.com/Service.svc/GetUSSContent';

  /**
   * Fetch Universal Singapore's waiting times
   * @returns {Promise}
   */
  fetchWaitTimes() {
    return new Promise((resolve, reject) => {
      // generate random geo location to fetch with
      const randomGeoLocation = GeoLocation.randomBetween(
        this.constructor.locationMin,
        this.constructor.locationMax,
      );

      this.log('Running Universal Studios Singapore');
      this.http({
        url: this.constructor.apiBase,
        body: {
          languageID: this.constructor.apiLangauge,
          filter: 'Ride',
          Latitude: randomGeoLocation.latitudeRaw,
          Longitude: randomGeoLocation.longitudeRaw,
        },
      }).then((body) => {
        // check the response is as we expect
        if (
          !body ||
          !body.ResponseOfUSS ||
          !body.ResponseOfUSS.Result ||
          !body.ResponseOfUSS.Result.USSZoneList ||
          !body.ResponseOfUSS.Result.USSZoneList.USSZone
        ) {
          this.log(`Error parsing Universal Studios Singapore response: ${body}`);
          reject(new Error('Unable to parse Universal Studios Singapore wait times response'));
          return;
        }

        // loop through each zone
        body.ResponseOfUSS.Result.USSZoneList.USSZone.forEach((zone) => {
          const rides = zone.Content.USSContent;

          // loop through each ride
          rides.forEach((ride) => {
            const rideObject = this.getRideObject({
              id: ride.USSContentID,
              name: ride.Name,
            });

            rideObject.waitTime = ride.Availability && ride.Availability === 'True'
              ? (parseInt(ride.QueueTime, 10) || -1)
              : -1;
          });
        });

        resolve();
      }, reject);
    });
  }

  // TODO: implement this function
  fetchOpeningTimes = undefined;
}

// export the class
module.exports = UniversalStudiosSingapore;
