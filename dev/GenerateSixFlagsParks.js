// allow console for unit tests
/* eslint-disable no-console */

const fs = require('fs');
const http = require('../lib/http');

const GeoLocation = require('../lib/geoLocation');

console.log('# This script generated the SixFlags park files automatically');
console.log('# There are so many parks by SixFlags, this is a far more convenient way of updating the codebase!');
console.log('');

// ADD THIS - get an API key from timezoned, and put it here to run this script
const timezonedbapikey = process.env.APIKEY || '';

if (!timezonedbapikey) {
  console.error("Missing Timezoned API key, this is needed for figuring out each park's timezone from it's geo location");
  console.error('Please fill in the variable in the script and re-run');
  process.exit(0);
}

const SixFlagsPark = require('../lib/sixflags/index');

SixFlagsPark.location = new GeoLocation({
  latitude: 33.7675,
  longitude: -84.5514,
});
SixFlagsPark.parkId = 1;
SixFlagsPark.parkName = 'Six Flags';
// make pretend SixFlagsPark to get API access setup
const sf = new SixFlagsPark();

function getTimeZone(lat, long) {
  return new Promise(((resolve, reject) => {
    http({
      url: 'http://api.timezonedb.com/v2/get-time-zone',
      data: {
        key: timezonedbapikey,
        format: 'json',
        lat,
        lng: long,
        by: 'position',
      },
    }).then((data) => {
      console.log(`Got timezone ${data.zoneName}`);
      resolve(data.zoneName);
    }, reject);
  }));
}

function createParkString(park) {
  return new Promise(((resolve, reject) => {
    const long = park.entranceLocation ? park.entranceLocation.longitude : park.location.longitude;
    const lat = park.entranceLocation ? park.entranceLocation.latitude : park.location.latitude;

    getTimeZone(lat, long).then((timezone) => {
      const parkID = park.name.replace(/é/g, 'e').replace(/[^a-zA-Z0-9]/g, '');

      console.log(`Filling in ${parkID}`);

      const parkString = `const SixFlagsPark = require('./index');

// our simple geolocation object library
const GeoLocation = require('../geoLocation');

/**
 * ${park.name}
 * @class
 * @extends SixFlagsPark
 */
class ${parkID} extends SixFlagsPark {
  static parkName = '${park.name}';
  static timezone = '${timezone}';
  static location = new GeoLocation({
    latitude: ${lat},
    longitude: ${long},
  });

  /**
   * The identifier for the park
   * @name ${parkID}.parkId
   * @type {String}
   */
  static parkId = '${park.parkId}';
}

module.exports = ${parkID};
`;
      // write file
      const filename = parkID.toLowerCase();
      console.log(`Writing file ${filename}.js`);
      fs.writeFile(`${__dirname}/../lib/sixflags/${filename}.js`, parkString, (err) => {
        if (err) {
          reject(err);
          return;
        }

        resolve(parkID);
      });
    }, reject);
  }));
}

// request park list from API
sf.getAPIUrl({
  url: `${SixFlagsPark.apiUrl}park`,
}).then((data) => {
  const todo = [...data.parks];
  const requires = [];
  const step = () => {
    const c = todo.shift();

    if (!c) {
      console.log('');
      requires.forEach((r) => {
        console.log(`const ${r} = require('./sixflags/${r.toLowerCase()}');`);
      });
      console.log('');
      requires.forEach((r) => {
        console.log(`const ${r} = require('./sixflags/${r.toLowerCase()}');`);
      });
      console.log('');
      requires.forEach((r) => {
        console.log(`"${r}": ${r},`);
      });
      return;
    }

    console.log(' ');
    console.log(`Processing ${c.name}`);

    // write park file
    createParkString(c).then((requirename) => {
      requires.push(requirename);

      process.nextTick(step);
    }, console.error);
  };
  process.nextTick(step);
});
