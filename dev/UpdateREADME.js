// this script generates the timezone and supported parks lists found in the README.md
import fs from 'fs';
import path from 'path';
import ThemeParks from '../dist';

let timezoneMarkdown = '\n';
let supportedParksMarkdown = '\n';
let parkFeaturesMarkdown = `|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
`;

// search for these tags to inject our new content
const supportedParkListStart = '<!-- START_SUPPORTED_PARKS_LIST -->';
const supportedParkListEnd = '<!-- END_SUPPORTED_PARKS_LIST -->';
const timezoneListStart = '<!-- START_PARK_TIMEZONE_LIST -->';
const timezoneListEnd = '<!-- END_PARK_TIMEZONE_LIST -->';
const parkFeaturesListStart = '<!-- START_PARK_FEATURES_SUPPORTED -->';
const parkFeaturesListEnd = '<!-- END_PARK_FEATURES_SUPPORTED -->';

// local path to the README file
const readmeFilePath = path.join(__dirname, '..', 'README.md');

// symbols to use for parks supporting/not-supporting features
const featureAvailable = '&#10003;';
const featureUnavailable = '&#10007;';

ThemeParks.AllParks.forEach((ParkClass) => {
  const parkObj = new ParkClass();
  // print out each supported park object name and "pretty name"
  supportedParksMarkdown += `* ${ParkClass.parkName} (ThemeParks.Parks.${ParkClass.parkName})\n`;
  // print each park's timezone into timezoneMarkdown
  timezoneMarkdown += `* ${ParkClass.parkName} [${ParkClass.location.toString()}]: (${ParkClass.timezone})\n`;

  parkFeaturesMarkdown +=
    `|${ParkClass.parkName}|${(
      // Wait Times
      parkObj.supportsWaitTimes
        ? featureAvailable
        : featureUnavailable
    )}|${(
      // Opening Times
      parkObj.supportsOpeningTimes
        ? featureAvailable
        : featureUnavailable
    )}|${(
      // Ride Schedules
      ParkClass.supportsRideSchedules
        ? featureAvailable
        : featureUnavailable
    )}|\n`;
});

// read in README.md
fs.readFile(readmeFilePath, (err, readmeData) => {
  // convert buffer to string
  const readmeString = readmeData.toString();

  // find START/END comments and replace with new content
  let newReadmeString = readmeString.replace(
    new RegExp(`${supportedParkListStart}[^<]*${supportedParkListEnd}`, 'g'),
    `${supportedParkListStart}\n${supportedParksMarkdown}\n${supportedParkListEnd}`,
  );
  newReadmeString = newReadmeString.replace(
    new RegExp(`${timezoneListStart}[^<]*${timezoneListEnd}`, 'g'),
    `${timezoneListStart}\n${timezoneMarkdown}\n${timezoneListEnd}`,
  );
  newReadmeString = newReadmeString.replace(
    new RegExp(`${parkFeaturesListStart}[^<]*${parkFeaturesListEnd}`, 'g'),
    `${parkFeaturesListStart}\n${parkFeaturesMarkdown}\n${parkFeaturesListEnd}`,
  );

  // only write new README data if file contents have changed
  if (newReadmeString.trim() !== readmeString.trim()) {
    // write back new readme file
    fs.writeFileSync(readmeFilePath, newReadmeString);
  }
});
