const _ = require('lodash');
const assert = require('assert');
const parks = require('./index').Parks;
const moment = require('moment-timezone');

// define Mocha functions for eslint
/* global describe it */

// allow console for unit tests
/* eslint-disable no-console */

// optional environment variable to print out API results
const PRINTDATA = !!process.env.PRINTDATA;

function validateDateTime(obj, key) {
  assert(obj, 'Date parent is not a valid object');
  assert(obj[key], `Date field ${key} is not a valid object`);

  // parse date using momentjs
  const date = moment(obj[key]);
  // const yesterday = moment().subtract(1, 'day');
  // make sure date is valid
  assert(date.isValid(), `Date ${obj[key]} is invalid`);
  // dates returned should be from today onwards
  // TODO - fix this logic, timezones mean that some parks will genuinely be open "yesterday"
  // assert(
  //   date.isAfter(yesterday),
  //   'Date ' + obj[key] + ' is before today (<= ' + yesterday.format() + ')',
  // );
}

function validateType(obj, key, tps) {
  // force types to an array
  const types = [].concat(tps);

  assert(obj, 'Object passed to type validator is not valid');

  const objectType = typeof (obj[key]);
  if (types.some(type => objectType === type)) {
    return;
  }

  console.log(obj);

  assert.fail(`Object ${obj[key]} is not of any required types: ${JSON.stringify(types)} (got ${objectType})`);
}

function testPark(Park) {
  const park = new Park();
  describe(`Park ${Park.name}`, () => {
    // === Test Wait Times Fetching ===
    describe('Get Park Wait Times', function getParkWaitTimes() {
      // give each test 2 minutes to finish
      this.timeout(1000 * 60 * 2);

      let times = [];

      it('should not return an error fetching ride times', (done) => {
        park.getWaitTimes((err, _times) => {
          times = _times;
          if (PRINTDATA) console.log(JSON.stringify(times, null, 2));
          assert(!err);
          done(err);
        });
      });

      it('should have some ride data', () => {
        assert(times);

        // Sesame Place doesn't return data in downtime, so sorry. This is a bad unit test.
        if (park.constructor.parkName === 'Sesame Place') return;

        assert(times.length > 3, `Not enough ride times to be valid data (<= 3), actual: ${times.length}`);
      });

      it('should have an ID for every ride', () => {
        times.forEach((ride) => {
          validateType(ride, 'id', ['string', 'number']);
        });
      });

      it('should have a wait time for every ride', () => {
        times.forEach((ride) => {
          validateType(ride, 'waitTime', 'number');
        });
      });

      it('should have a name for every ride', () => {
        times.forEach((ride) => {
          validateType(ride, 'name', 'string');
        });
      });

      it('should have an active state for every ride', () => {
        times.forEach((ride) => {
          validateType(ride, 'active', 'boolean');
        });
      });

      it('should have a fastpass field for every ride', () => {
        times.forEach((ride) => {
          validateType(ride, 'fastPass', 'boolean');

          // if any ride claims to have fastPass, so should the park
          if (ride.fastPass) {
            assert(park.constructor.fastPass, 'If any ride has fastPass available, the park should also support fastPass');
          }
        });
      });

      it('should have a status field for every ride', () => {
        times.forEach((ride) => {
          validateType(ride, 'status', 'string');
          // status string should only ever be one of these three options
          assert(
            (
              ride.status === 'Operating' ||
              ride.status === 'Refurbishment' ||
              ride.status === 'Closed' ||
              ride.status === 'Down'
            ),
            `Invalid status string returned by ${ride.name}: ${ride.status}`,
          );
        });
      });

      it('should have matching status and active fields', () => {
        times.forEach((ride) => {
          // check status and active variables match up
          if (ride.status === 'Operating') assert(ride.active, 'Ride cannot have Operating status and be inactive');
          else assert(!ride.active, "Ride can't be active without Operating status");
        });
      });
    });

    // === Test Schedule Fetching ===
    describe('Get Schedule', function getSchedule() {
      // give each test 2 minutes to finish
      this.timeout(1000 * 60 * 2);

      let schedule = [];
      it('should not error when fetching schedule', (done) => {
        park.getOpeningTimes((err, _schedule) => {
          assert(!err, `getOpeningTimes returned an error: ${err}`);

          schedule = _schedule;

          if (PRINTDATA) console.log(JSON.stringify(schedule, null, 2));

          done(err);
        });
      });

      it('should have schedule data', () => {
        assert(schedule);
        assert(schedule.length > 3, `Should be at least 4 schedule items. Found ${schedule.length}`);
      });

      it('should have a valid date for each schedule entry', () => {
        schedule.forEach((day) => {
          validateDateTime(day, 'date');
        });
      });

      // skip if this day is closed
      it('should have a valid opening time for each schedule entry', () => {
        schedule.forEach((day) => {
          if (day.type && day.type === 'Closed') return;
          validateDateTime(day, 'openingTime');
        });
      });

      it('should have a valid closing time for each schedule entry', () => {
        schedule.forEach((day) => {
          if (day.type && day.type === 'Closed') return;
          validateDateTime(day, 'closingTime');
        });
      });

      // TODO - test the "special hours" array has valid data too
    });
  });
}

function Run() {
  if (process.env.PARKID) {
    const parkId = process.env.PARKID;
    const Park = parks[parkId];
    if (Park) {
      // run tests against a single park
      testPark(Park);
      return;
    }
    // else park missing, just fall through to standard full test
  }

  // test all parks supported (and exposed) by the API
  _.forEach(parks, (Park) => {
    testPark(Park);
  });
}
Run();

/* eslint-enable no-console */
