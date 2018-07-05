import moment from 'moment-timezone';
import GeoLocation from './geoLocation';
// our schedule library
import Schedule from './schedule';

// symbols
const symbolRideId = Symbol('ride ID');
const symbolRideName = Symbol('ride name');
const symbolRideType = Symbol('ride type');
const symbolRideLocation = Symbol('ride location');
const symbolRideDetail = Symbol('ride detail');
const symbolCurrentWaitTime = Symbol('current wait time');
const symbolFastPassAvailable = Symbol('fast pass is available');
const symbolFastPassReturnTimeAvailable = Symbol('fast pass return time is available');
const symbolFastPassReturnTimeStart = Symbol('fast pass return time start');
const symbolFastPassReturnTimeEnd = Symbol('fast pass return time end');
const symbolLastTimeUpdate = Symbol('last updated time');
const symbolLastTimeFastPassUpdate = Symbol('last fastPass updated time');
const symbolScheduleData = Symbol('schedule data');

/**
 * @typedef RideData
 * @type Object
 * @property {String} id Unique Ride ID
 * @property {String} name The ride's name
 * @property {Bool} active Is this ride currently operating?
 * @property {Number} wait_time Ride's current queue time
 * @property {Number} last_update Last time this Ride has a wait time change (in milliseconds)
 */

/**
 * Ride Class
 * Each ride object represents one ride at a theme park.
 * This object will hold the ride's current state.
 * @class
 */
class Ride {
  /**
   * Create a new Ride object
   * @param {Object} options New ride data
   * @param {String} options.id Ride's Unique ID
   * @param {String} options.name Ride name
   */
  constructor(options) {
    if (!options.id) throw new Error('No ride ID supplied to new ride object');
    if (!options.name) throw new Error('No ride name supplied to new ride object');

    this[symbolRideId] = options.id;
    this[symbolRideName] = options.name;
    this[symbolRideType] = options.type;
    if (options.location) {
      this[symbolRideLocation] = new GeoLocation(options.location);
    }
    this[symbolRideDetail] = options.detail;

    // by default, rides don't support fastpass
    this[symbolFastPassAvailable] = false;

    // make our own schedule data object!
    this[symbolScheduleData] = new Schedule();
  }

  /**
   * Serialize this object (automatically called by JSON.stringify etc.)
   * @returns {RideData} Current ride state
   */
  toJSON() {
    // try to extract schedule data for this ride
    const openingHours = this[symbolScheduleData].getDate({
      date: moment(),
    });
    const jsonData = {
      id: this[symbolRideId],
      name: this.rideName,
      type: this.type,
      location: this.location.toJSON(),
      detail: this.detail,
      active: this.active,
      waitTime: this.waitTime,
      fastPass: this.fastPass,
      lastUpdate: this.lastUpdate,
      status: this.status,
    };

    // add fastPass return times (if available)
    if (this[symbolFastPassReturnTimeAvailable]) {
      jsonData.fastPassReturnTime = {
        startTime: this.fastPassReturnTimeStart,
        endTime: this.fastPassReturnTimeEnd,
        lastUpdate: this[symbolLastTimeFastPassUpdate],
      };
    }

    // add opening hours to ride data if we actually have any!
    if (openingHours) {
      jsonData.schedule = openingHours;
    }

    return jsonData;
  }

  /**
   * Restore a state from a JSON object
   * Mainly used to restore ride data from cached data
   * @param {RideData} rideData Ride data to restore (ideally created using toJSON)
   */
  fromJSON(rideData) {
    // restore base ride data
    this[symbolRideId] = rideData.id;
    this[symbolRideName] = rideData.name;
    this[symbolRideType] = rideData.type;
    this[symbolRideLocation] = new GeoLocation(rideData.location);
    this[symbolRideDetail] = rideData.detail;
    this[symbolLastTimeUpdate] = rideData.lastUpdate;
    this[symbolFastPassAvailable] = rideData.fastPass;

    // .active is inferred by waitTime
    if (!rideData.active) {
      // set waitTime to -1 if the ride isn't active
      this[symbolCurrentWaitTime] = -1;
    } else {
      this[symbolCurrentWaitTime] = rideData.waitTime;
    }

    // import any schedule data (if we have any)
    if (rideData.schedule) {
      this[symbolScheduleData].setDate(rideData.schedule);

      // also re-import special schedule data (if we have any)
      if (rideData.schedule.special && rideData.schedule.special.length > 0) {
        rideData.schedule.special.forEach((specialSchedule) => {
          this[symbolScheduleData].setDate({
            date: specialSchedule.date,
            openingTime: specialSchedule.openingTime,
            closingTime: specialSchedule.closingTime,
            type: specialSchedule.type,
            specialHours: true,
          });
        });
      }
    }
  }

  /**
   * Get this ride's name
   * Note: Will attempt to return in English,
   * but will fallback to park's local locale if English isn't available
   * @type {String}
   */
  get rideName() {
    return this[symbolRideName];
  }

  /**
   * Get this ride's type
   * @type {String}
   */
  get type() {
    return this[symbolRideType];
  }

  /**
   * Get this ride's location
   * @type {GeoLocation}
   */
  get location() {
    return this[symbolRideLocation];
  }

  /**
   * Get this ride's detail
   * @type {Object}
   */
  get detail() {
    return this[symbolRideDetail];
  }

  /**
   * Set this ride's wait time
   * Set to -1 when ride is Closed
   * Set to -2 when ride is Down
   * @type {Number}
   */
  set waitTime(value) {
    // check for updated (or brand new) wait time for this ride
    if (this[symbolCurrentWaitTime] === undefined || this[symbolCurrentWaitTime] !== value) {
      // update our last updated time to now
      this[symbolLastTimeUpdate] = Date.now();
      // update our wait time for this ride
      this[symbolCurrentWaitTime] = value;
    }

    // value hasn't changed, don't do anything
  }

  /**
   * Get this ride's current wait time. Will always be >= 0.
   * Use .active to determine ride's open status
   * @type {Number}
   */
  get waitTime() {
    // always return positive ints for the wait time, even when inactive or not defined yet
    if (this[symbolCurrentWaitTime] === undefined || this[symbolCurrentWaitTime] < 0) return 0;

    return this[symbolCurrentWaitTime];
  }

  /**
   * Set this ride's fast pass availability
   * @type {Boolean}
   */
  set fastPass(value) {
    if (this[symbolFastPassAvailable] !== value) {
      // update our last updated time to now
      this[symbolLastTimeUpdate] = Date.now();
      // update fastpass status
      this[symbolFastPassAvailable] = value;
    }
  }

  /**
   * Get this ride's fast pass availability
   * @type {Boolean}
   */
  get fastPass() {
    return this[symbolFastPassAvailable];
  }

  /**
   * Set whether we have valid fast pass return times or not
   * Setting start/end times automatically sets this to true,
   * only need to call this if fastPass availability has ran out
   * @type {Boolean}
   */
  set fastPassReturnTimeAvailable(value) {
    if (this[symbolFastPassReturnTimeAvailable] !== value) {
      // update availability
      this[symbolFastPassReturnTimeAvailable] = value;
      // update our last fastPass updated time to now
      this[symbolLastTimeFastPassUpdate] = Date.now();
    }
  }

  /**
   * Does this ride have a fastPass return time available?
   */
  get fastPassReturnTimeAvailable() {
    return this[symbolFastPassReturnTimeAvailable];
  }

  /**
   * Set this ride's fastPass return time window start
   * @type {Moment}
   */
  set fastPassReturnTimeStart(value) {
    // check if this fastPass is
    if (!value.isSame(this[symbolFastPassReturnTimeStart])) {
      // mark this as true so we know to add this to our JSON object
      this[symbolFastPassReturnTimeAvailable] = true;
      // update our last fastPass updated time to now
      this[symbolLastTimeFastPassUpdate] = Date.now();
      // use new fastPass return start time
      this[symbolFastPassReturnTimeStart] = value;
    }
  }

  /**
   * Get this ride's fast pass return time start
   * (Time in format of "HH:mm")
   * @type {String}
   */
  get fastPassReturnTimeStart() {
    return this[symbolFastPassReturnTimeStart].format('HH:mm');
  }

  /**
   * Set this ride's fastPass return time window end
   * @type {Moment}
   */
  set fastPassReturnTimeEnd(value) {
    // check if this fastPass is
    if (!value.isSame(this[symbolFastPassReturnTimeEnd])) {
      // mark this as true so we know to add this to our JSON object
      this[symbolFastPassReturnTimeAvailable] = true;
      // update our last fastPass updated time to now
      this[symbolLastTimeFastPassUpdate] = Date.now();
      // use new fastPass return end time
      this[symbolFastPassReturnTimeEnd] = value;
    }
  }

  /**
   * Get this ride's fast pass return time emd
   * (Time in format of "HH:mm")
   * @type {String}
   */
  get fastPassReturnTimeEnd() {
    return this[symbolFastPassReturnTimeEnd].format('HH:mm');
  }

  /**
   * Is this ride currently running?
   * @type {Boolean}
   */
  get active() {
    // if we have no data yet, assume ride is inactive
    if (this[symbolCurrentWaitTime] === undefined) return false;

    return this[symbolCurrentWaitTime] >= 0;
  }

  /**
   * String status for this ride
   * Can only ever be either "Operating", "Down", "Closed", or "Refurbishment"
   * @type {String}
   */
  get status() {
    // first, check the schedule for non-operating types
    //  refurbishment/closed schedule overrules all other statuses, as this is planned maintenance
    //  i.e, rides don't usually schedule maintenance and then randomly open mid-day
    const todaysSchedule = this.schedule.getDate({
      date: moment(),
    });
    if (todaysSchedule && todaysSchedule.type !== 'Operating') {
      return todaysSchedule.type;
    }

    // wait time set to -2 when ride is Down
    if (parseInt(this[symbolCurrentWaitTime], 10) === -2) return 'Down';

    // otherwise, return a string matching current active status
    return (this.active ? 'Operating' : 'Closed');
  }

  /**
   * Get this ride's last wait time update time.
   * Note: Can be undefined
   * @type {Number}
   */
  get lastUpdate() {
    return this[symbolLastTimeUpdate];
  }

  /**
   * Get this ride's schedule object
   * @type {Schedule}
   */
  get schedule() {
    return this[symbolScheduleData];
  }
}

// export the Ride class
export default Ride;
