// allow console for unit tests
/* eslint-disable no-console, import/no-extraneous-dependencies */

// define Mocha functions for eslint
/* global describe it */

import _ from 'lodash';
import assert from 'assert';
import crypto from 'crypto';
import tzlookup from 'tz-lookup';
import Park from './park';
import themeparks from './index';
import Cache from './cache';

function generateRandomString() {
  return crypto.randomBytes(20).toString('hex');
}

try {
  console.log('Starting themeparks tests...');

  // test base park implementation doesn't implement anything invalid
  describe('Test base park implementation', () => {
    let parkBase;
    it('should not create the park base successfully', (done) => {
      try {
        parkBase = new Park();
        assert(!parkBase, 'parkBase should not successfully construct');
      } catch (err) {
        done();
      }
    });
  });

  // some caching tests
  describe('Test caching module', function testCachingModule() {
    // extend the timeout of these tests to handle ttl test case
    this.timeout(1000 * 5);

    const cacher = new Cache({
      prefix: 'test',
    });
    // create a unique key for testing against
    const cacheKey = (new Date()).toUTCString();

    it('should fail for cache items not yet set', (done) => {
      cacher.getCachedValue(`${cacheKey}_invalid`).then(() => {
        done('Cache should not return data for a not set key');
      }, done);
    });

    it('should return identical data on get after cache data has been set', (done) => {
      const randomString = generateRandomString();
      cacher.setCachedValue(cacheKey, randomString, {
        ttl: 10,
      }).then(() => {
        // now test we can get the data back
        cacher.getCachedValue(cacheKey).then((data) => {
          if (data !== randomString) {
            done("Returned data doesn't match set random string");
            return;
          }
          done();
        }, () => {
          done('Failed to get cache string response back');
        });
      }, () => {
        done('Failed to set cache string');
      });
    });

    it('should expire items after request ttl', (done) => {
      const randomString = generateRandomString();
      const ttlTime = 1;

      cacher.setCachedValue(`${cacheKey}timed`, randomString, {
        ttl: ttlTime,
      }).then(() => {
        cacher.getCachedValue(`${cacheKey}timed`).then((data) => {
          assert(data === randomString, "Returned data doesn't match set random string (timed test)");
          setTimeout(() => {
            cacher.getCachedValue(`${cacheKey}timed`).then(() => {
              done('Should not return valid data after the ttl has expired');
            }, done);
          }, (ttlTime + 0.5) * 1000);
        }, () => {
          done('Failed to get cached data immediately (timed test)');
        });
      }, () => {
        done('Failed to set cache string (timed test)');
      });
    });

    // cache wrap tests
    it('should cache wrap correctly with non-existant key', (done) => {
      let wrapCallbackCalled = false;
      const randomString = generateRandomString();

      cacher.wrap(`${cacheKey}wrap`, () => {
        // mark callback as called
        wrapCallbackCalled = true;

        return new Promise(((resolve) => {
          resolve(randomString);
        }));
      }, 10).then((data) => {
        if (!wrapCallbackCalled) {
          done('Wrap data setter function failed to be called for missing key');
        } else if (data !== randomString) {
          done("Wrapped data returned doesn't match generated random string");
        } else {
          done();
        }
      }, () => {
        done('Failed to call wrap function');
      });
    });

    it('should cache wrap correctly with already set key', (done) => {
      const randomString = generateRandomString();

      cacher.setCachedValue(`${cacheKey}wrapsetkey`, randomString).then(() => {
        // test key set, now test wrapping against it
        cacher.wrap(`${cacheKey}wrapsetkey`, () => {
          // this callback should never be called, because the key exists
          done('Callback to set key in Wrap called, but key already exists');
        }, 10).then((data) => {
          if (data !== randomString) {
            done("Wrapped data returned doesn't match generated random string");
          } else {
            done();
          }
        }, () => {
          done('Failed to call wrap function after manually setting key');
        });
      }, () => {
        done('Failed to set wrap set key test');
      });
    });
  });

  // test exposed parks are done correctly
  describe('Test exposed parks are setup correctly', () => {
    it('should have an array of parks as .AllParks', () => {
      assert(Array.isArray(themeparks.AllParks), '.AllParks should be an array of all the parks available');
    });

    it('should have an object of parks as .Parks', () => {
      assert(themeparks.Parks.constructor === {}.constructor, '.Parks should be an object of available parks');

      _.forEach(themeparks.Parks, (ParkClass, i) => {
        const park = new ParkClass();
        assert(!!park, `Park ${i} (${ParkClass.name}) failed to initialize.`);
      });
    });

    themeparks.AllParks.forEach((ParkClass, i) => {
      it(`park .AllParks[${i}]{${ParkClass.name}} should have a corresponding .Parks entry`, () => {
        assert(
          themeparks.Parks[ParkClass.name] !== undefined,
          `park ${ParkClass.name} should have an entry called ${ParkClass.name} in .Parks`,
        );
      });
    });

    Object.keys(themeparks.Parks).forEach((parkName) => {
      it(`park .Parks[${parkName}] should have a corresponding .AllParks entry`, () => {
        const foundPark = themeparks.AllParks.some(park => park.name === parkName);
        assert(foundPark, `.AllParks should have a reference to ${parkName}`);
      });
    });
  });

  describe('Test parks have correct timezone setup', () => {
    themeparks.AllParks.forEach((ParkClass) => {
      it(`park .Parks[${ParkClass.parkName}] should use the correct timezone`, () => {
        let locationTimezone = tzlookup(
          ParkClass.location.latitudeRaw,
          ParkClass.location.longitudeRaw,
        );

        // Montreal was removed from timezone database in 2013
        //  so manually change this to Toronto
        //  (I want to remain compatible with any systems with modern tzdata files)
        //  see https://en.wikipedia.org/wiki/America/Montreal#Relation_to_America.2FToronto
        if (locationTimezone === 'America/Montreal') {
          locationTimezone = 'America/Toronto';
        }

        assert.equal(
          locationTimezone,
          ParkClass.timezone,
          `${ParkClass.parkName} should have ${locationTimezone} set as timezone`,
        );
      });
    });
  });

  describe('Check parks have unique geo-positions', () => {
    // create a list of park locations first
    const positions = {};
    themeparks.AllParks.forEach((ParkClass) => {
      const positionString = ParkClass.location.toString();
      if (!positions[positionString]) positions[positionString] = [];
      positions[positionString].push(ParkClass.parkName);
    });

    themeparks.AllParks.forEach((ParkClass) => {
      it(`park .Parks[${ParkClass.parkName}] should have a unique geo location`, () => {
        const positionString = ParkClass.location.toString();
        assert.equal(
          positions[positionString].length,
          1,
          `${ParkClass.parkName}'s position (${positionString}) should be unique`,
        );
      });
    });
  });
} catch (err) {
  console.error('Unit tests failed');
  console.error(err);
  process.exit(1);
}

/* eslint-enable no-console */
