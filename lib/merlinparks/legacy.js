// include core Park class
const Park = require('../park');

/**
 * Implements the Merlin Park API framework.
 * Thorpe Park, Alton Towers, Chessington etc. use this API framework
 * @class
 * @extends Park
 */
class MerlinPark extends Park {
  /**
   * Create new Merlin Object.
   * This object should not be called directly,
   * but rather extended for each of the individual Merlin parks
   * @param {Object} options
   */
  constructor(options = {}) {
    // inherit from base class
    super(options);

    // custom API options
    if (!this.constructor.apiBase) throw new Error('Merlin Parks require an API base to work');
    if (!this.constructor.apiKey) throw new Error('Merlin Parks require an API key');
    if (!this.constructor.rideNames) throw new Error('Merlin Parks require an array of rideNames');
  }

  /**
   * The user agent filter for the park
   * @name MerlinPark.userAgentFilter
   * @type {String}
   */
  static userAgentFilter = 'Apache-HttpClient/UNAVAILABLE (java 1.4)';

  /**
   * Fetch Wait Times for Merlin Park
   */
  fetchWaitTimes() {
    return new Promise(((resolve, reject) => {
      // request challenge string
      this.http({
        method: 'POST',
        url: `${this.constructor.apiBase}/queue-times`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Connection: 'Keep-Alive',
        },
      }).then((data) => {
        if (!data.challenge) {
          reject(new Error(`Failed to get challenge string from API: ${JSON.stringify(data)}`));
          return;
        }
        this.log(`Got challenge string ${data.challenge} for park ${this.constructor.parkName}`);

        this.GenerateAPIResponse(data.challenge).then((response) => {
          this.log(`Generated response string ${response}`);

          // make API request with our response request
          this.http({
            method: 'POST',
            url: `${this.constructor.apiBase}/queue-times`,
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Connection: 'Keep-Alive',
            },
            body: {
              response,
              challenge: data.challenge,
              resort: this.constructor.resortId || null,
            },
          }).then((waittimes) => {
            // park API results differ ever so slightly.
            // Chessington has it under "queue-times", Alton Towers just returns an array
            const rideData = (waittimes['queue-times'] || waittimes);

            rideData.forEach((ride) => {
              const rideName = this.constructor.rideNames[ride.id];
              // skip if we have no name for this asset
              if (!rideName) return;

              // apply each wait time data
              const rideObject = this.getRideObject({
                id: ride.id,
                name: rideName,
              });

              if (!rideObject) {
                this.log(`Failed to find ride with ID ${ride.id}`);
              } else {
                // update ride wait time
                rideObject.waitTime = ride.status === 'closed' ? -1 : (ride.wait_time || -1);
              }
            });
            resolve();
          }, reject);
        }, reject);
      }, reject);
    }));
  }

  /**
   * Generate a response to a challenge for this park
   * @returns {Promise<String>} Promise resolving with the challenge response for this park
   */
  GenerateAPIResponse(challenge) {
    // each park does this very slightly differently,
    // so each park needs to implement their own version of this
    if (this.apiRespond === undefined) {
      return Promise.reject(new Error('Park needs to implement API response function apiRespond to make API requests'));
    }
    return Promise.resolve(this.apiRespond(challenge));
  }
}

// export the class
module.exports = MerlinPark;
