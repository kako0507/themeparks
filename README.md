# themeparks fork from [cubehouse/themeparks](https://github.com/cubehouse/themeparks)

An unofficial API library for accessing ride wait times and park opening times for many theme parks around the world, including Disney, Universal and SeaWorld parks.

[![Build Status](https://travis-ci.org/kako0507/themeparks.svg?branch=master)](https://travis-ci.org/kako0507/themeparks) 
[Supported Parks](#supported-park-features)

## Example Use

    // include the Themeparks library
    const Themeparks = require('./dist');

    // list all the parks supported by the library
    Themeparks.AllParks.forEach((ParkClass, i) => {
        console.log("* " + ParkClass.name);
    });

    // access a specific park
    const disneyMagicKingdom = new Themeparks.Parks.WaltDisneyWorldMagicKingdom();

    // access wait times by Promise
    disneyMagicKingdom.getWaitTimes().then((rides) => {
        // print each wait time
        rides.forEach((ride) => {
            console.log(ride.name + ": " + ride.waitTime + " minutes wait");
        })
    }, console.error);

    // get park opening times
    disneyMagicKingdom.getOpeningTimes().then((times) => {
        // print opening times
        times.forEach((time) => {
            if (time.type === 'Operating') {
                console.log("[" + time.date + "] Open from " + time.openingTime + " until " + time.closingTime);
            }
        });
    }, console.error);

### Caching

It is possible to speed up the library by passing on a caching module.

This is highly recommended. Using caching allows various data to persist between executions of the library, which will speed up initialisation after any application restarts.

First, install the caching system you wish to use with node-cache-manager. For example, the below uses file-system caching (Redis/Mongo or the alike recommended). For this example, you can install the filesystem cacher with ```npm install cache-manager-fs-binary --save```.

To do so, populate the Themeparks.settings.cache variables before using the library.

    // include the Themeparks library
    const Themeparks = require('themeparks');

    // initialise caching (see https://github.com/BryanDonovan/node-cache-manager)
    const cacheManager = require('cache-manager');
    Themeparks.settings.cache = cacheManager.caching({
        store: require('cache-manager-fs-binary'),
        options: {
            reviveBuffers: false,
            binaryAsStream: true,
            ttl: 60 * 60,
            maxsize: 1000 * 1000 * 1000,
            path: 'diskcache',
            preventfill: false
        }
    });

See [https://github.com/BryanDonovan/node-cache-manager](https://github.com/BryanDonovan/node-cache-manager) for other caching systems available.

### Using Promises or callbacks

Both getWaitTimes and getOpeningTimes work either through callback or Promises.

This is the same as the above example, but using a callback instead of a Promise.

    // access wait times via callback
    disneyMagicKingdom.getWaitTimes((err, rides) => {
        if (err) return console.error(err);

        // print each wait time
        ride.forEach((ride) => {
            console.log(ride.name + ": " + ride.waitTime + " minutes wait");
        });
    });

### Proxy

If you wish to use themeparks with a proxy, you can set a proxy in the library settings.

    // include the Themeparks library
    const Themeparks = require('themeparks');

    // setup proxy (this is a library-wide setting, all further HTTP requests will use this proxy)
    Themeparks.settings.proxyUrl = 'socks://127.0.0.1:9050';

## Change Log

[View themeparks Change Log](CHANGELOG.md)

## Parks available

<!-- START_SUPPORTED_PARKS_LIST -->

* Magic Kingdom - Walt Disney World Florida (ThemeParks.Parks.Magic Kingdom - Walt Disney World Florida)
* Epcot - Walt Disney World Florida (ThemeParks.Parks.Epcot - Walt Disney World Florida)
* Hollywood Studios - Walt Disney World Florida (ThemeParks.Parks.Hollywood Studios - Walt Disney World Florida)
* Animal Kingdom - Walt Disney World Florida (ThemeParks.Parks.Animal Kingdom - Walt Disney World Florida)
* Magic Kingdom - Disneyland Resort (ThemeParks.Parks.Magic Kingdom - Disneyland Resort)
* California Adventure - Disneyland Resort (ThemeParks.Parks.California Adventure - Disneyland Resort)
* Magic Kingdom - Disneyland Paris (ThemeParks.Parks.Magic Kingdom - Disneyland Paris)
* Walt Disney Studios - Disneyland Paris (ThemeParks.Parks.Walt Disney Studios - Disneyland Paris)
* Magic Kingdom - Shanghai Disney Resort (ThemeParks.Parks.Magic Kingdom - Shanghai Disney Resort)
* Tokyo Disney Resort - Magic Kingdom (ThemeParks.Parks.Tokyo Disney Resort - Magic Kingdom)
* Tokyo Disney Resort - Disney Sea (ThemeParks.Parks.Tokyo Disney Resort - Disney Sea)
* Hong Kong Disneyland (ThemeParks.Parks.Hong Kong Disneyland)
* Universal Studios Florida (ThemeParks.Parks.Universal Studios Florida)
* Universal's Islands Of Adventure (ThemeParks.Parks.Universal's Islands Of Adventure)
* Universal Volcano Bay (ThemeParks.Parks.Universal Volcano Bay)
* Universal Studios Hollywood (ThemeParks.Parks.Universal Studios Hollywood)
* Universal Studios Singapore (ThemeParks.Parks.Universal Studios Singapore)
* Europa Park (ThemeParks.Parks.Europa Park)
* Six Flags Over Texas (ThemeParks.Parks.Six Flags Over Texas)
* Six Flags Over Georgia (ThemeParks.Parks.Six Flags Over Georgia)
* Six Flags St. Louis (ThemeParks.Parks.Six Flags St. Louis)
* Six Flags Great Adventure (ThemeParks.Parks.Six Flags Great Adventure)
* Six Flags Magic Mountain (ThemeParks.Parks.Six Flags Magic Mountain)
* Six Flags Great America (ThemeParks.Parks.Six Flags Great America)
* Six Flags Fiesta Texas (ThemeParks.Parks.Six Flags Fiesta Texas)
* Six Flags Hurricane Harbor, Arlington (ThemeParks.Parks.Six Flags Hurricane Harbor, Arlington)
* Six Flags Hurricane Harbor, Los Angeles (ThemeParks.Parks.Six Flags Hurricane Harbor, Los Angeles)
* Six Flags America (ThemeParks.Parks.Six Flags America)
* Six Flags Discovery Kingdom (ThemeParks.Parks.Six Flags Discovery Kingdom)
* Six Flags New England (ThemeParks.Parks.Six Flags New England)
* Six Flags Hurricane Harbor, Jackson (ThemeParks.Parks.Six Flags Hurricane Harbor, Jackson)
* The Great Escape (ThemeParks.Parks.The Great Escape)
* Six Flags White Water, Atlanta (ThemeParks.Parks.Six Flags White Water, Atlanta)
* Six Flags México (ThemeParks.Parks.Six Flags México)
* La Ronde, Montreal (ThemeParks.Parks.La Ronde, Montreal)
* Six Flags Hurricane Harbor, Oaxtepec (ThemeParks.Parks.Six Flags Hurricane Harbor, Oaxtepec)
* Alton Towers (ThemeParks.Parks.Alton Towers)
* Thorpe Park (ThemeParks.Parks.Thorpe Park)
* Chessington World Of Adventures (ThemeParks.Parks.Chessington World Of Adventures)
* Parc-Asterix (ThemeParks.Parks.Parc-Asterix)
* Hershey Park (ThemeParks.Parks.Hershey Park)
* Silver Dollar City (ThemeParks.Parks.Silver Dollar City)
* Dollywood (ThemeParks.Parks.Dollywood)
* Knott's Berry Farm (ThemeParks.Parks.Knott's Berry Farm)
* Cedar Point (ThemeParks.Parks.Cedar Point)
* Carowinds (ThemeParks.Parks.Carowinds)
* Canada's Wonderland (ThemeParks.Parks.Canada's Wonderland)
* Kings Island (ThemeParks.Parks.Kings Island)
* Efteling (ThemeParks.Parks.Efteling)

<!-- END_SUPPORTED_PARKS_LIST -->

## Supported Park Features

<!-- START_PARK_FEATURES_SUPPORTED -->
|Park|Wait Times|Park Opening Times|Ride Opening Times|
|:---|:---------|:-----------------|:-----------------|
|Magic Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Epcot - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Hollywood Studios - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Animal Kingdom - Walt Disney World Florida|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Disneyland Resort|&#10003;|&#10003;|&#10003;|
|California Adventure - Disneyland Resort|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Walt Disney Studios - Disneyland Paris|&#10003;|&#10003;|&#10003;|
|Magic Kingdom - Shanghai Disney Resort|&#10003;|&#10003;|&#10003;|
|Tokyo Disney Resort - Magic Kingdom|&#10003;|&#10003;|&#10007;|
|Tokyo Disney Resort - Disney Sea|&#10003;|&#10003;|&#10007;|
|Hong Kong Disneyland|&#10003;|&#10003;|&#10003;|
|Universal Studios Florida|&#10003;|&#10003;|&#10007;|
|Universal's Islands Of Adventure|&#10003;|&#10003;|&#10007;|
|Universal Volcano Bay|&#10003;|&#10003;|&#10007;|
|Universal Studios Hollywood|&#10003;|&#10003;|&#10007;|
|Universal Studios Singapore|&#10003;|&#10003;|&#10007;|
|Europa Park|&#10003;|&#10003;|&#10007;|
|Six Flags Over Texas|&#10003;|&#10003;|&#10007;|
|Six Flags Over Georgia|&#10003;|&#10003;|&#10007;|
|Six Flags St. Louis|&#10003;|&#10003;|&#10007;|
|Six Flags Great Adventure|&#10003;|&#10003;|&#10007;|
|Six Flags Magic Mountain|&#10003;|&#10003;|&#10007;|
|Six Flags Great America|&#10003;|&#10003;|&#10007;|
|Six Flags Fiesta Texas|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Arlington|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Los Angeles|&#10003;|&#10003;|&#10007;|
|Six Flags America|&#10003;|&#10003;|&#10007;|
|Six Flags Discovery Kingdom|&#10003;|&#10003;|&#10007;|
|Six Flags New England|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Jackson|&#10003;|&#10003;|&#10007;|
|The Great Escape|&#10003;|&#10003;|&#10007;|
|Six Flags White Water, Atlanta|&#10003;|&#10003;|&#10007;|
|Six Flags México|&#10003;|&#10003;|&#10007;|
|La Ronde, Montreal|&#10003;|&#10003;|&#10007;|
|Six Flags Hurricane Harbor, Oaxtepec|&#10003;|&#10003;|&#10007;|
|Alton Towers|&#10003;|&#10003;|&#10007;|
|Thorpe Park|&#10003;|&#10003;|&#10007;|
|Chessington World Of Adventures|&#10003;|&#10003;|&#10007;|
|Parc-Asterix|&#10003;|&#10003;|&#10003;|
|Hershey Park|&#10003;|&#10003;|&#10007;|
|Silver Dollar City|&#10003;|&#10003;|&#10007;|
|Dollywood|&#10003;|&#10003;|&#10007;|
|Knott's Berry Farm|&#10003;|&#10003;|&#10007;|
|Cedar Point|&#10003;|&#10003;|&#10007;|
|Carowinds|&#10003;|&#10003;|&#10007;|
|Canada's Wonderland|&#10003;|&#10003;|&#10007;|
|Kings Island|&#10003;|&#10003;|&#10007;|
|Efteling|&#10003;|&#10003;|&#10007;|

<!-- END_PARK_FEATURES_SUPPORTED -->

## Result Objects

### Ride Wait Times

    [
        {
            id: (string or number: uniquely identifying a ride),
            name: (string: ride name),
            waitTime: (number: current wait time in minutes),
            active: (bool: is the ride currently active?),
            fastPass: (bool: is fastpass available for this ride?),
            fastPassReturnTime: { (object containing current return times, parks supporting this will set fastPassReturnTimes to true - entire field may be null for unsupported rides or when fastPass has ran out for the day)
                startTime: (string return time formatted as "HH:mm": start of the current return time period),
                endTime: (string return time formatted as "HH:mm": end of the current return time period),
                lastUpdate: (JavaScript Date object: last time the fastPass return time changed),
            },
            status: (string: will either be "Operating", "Closed", or "Down"),
            lastUpdate: (JavaScript Date object: last time this ride had new data),
            schedule: { **schedule will only be present if park.supportsRideSchedules is true**
              openingTime: (timeFormat timestamp: opening time of ride),
              closingTime: (timeFormat timestamp: closing time of ride),
              type: (string: "Operating" or "Closed"),
              special: [ (array of "special" ride times, usually Disney Extra Magic Hours or similar at other parks - field may be null)
                openingTime: (timeFormat timestamp: opening time for ride),
                closingTime: (timeFormat timestamp: closing time for ride),
                type: (string: type of schedule eg. "Extra Magic Hours", but can be "Event" or "Special Ticketed Event" or other)
              ]
            },
        },
        ...
    ]

### Schedules

    [
        {
            date: (dateFormat timestamp: day this schedule applies),
            openingTime: (timeFormat timestamp: opening time for requested park - can be null if park is closed),
            closingTime: (timeFormat timestamp: closing time for requested park - can be null if park is closed),
            type: (string: "Operating" or "Closed"),
            special: [ (array of "special" times for this day, usually Disney Extra Magic Hours or similar at other parks - field may be null)
              openingTime: (timeFormat timestamp: opening time for requested park),
              closingTime: (timeFormat timestamp: closing time for requested park),
              type: (string: type of schedule eg. "Extra Magic Hours", but can be "Event" or "Special Ticketed Event" or other)
            ],
        },
        ...
    ]

## Park Object values

There are some values available on each park object that may be useful.

|Variable|Description|
|:-------|:----------|
|Name|Name of the park|
|timezone|The park's local timezone|
|Location|This park's location (as a "GeoLocation" object, see [GeoLocation Docs](https://cubehouse.github.io/themeparks/GeoLocation.html) for available methods/properties)|
|supportsWaitTimes|Does this park's API support ride wait times?|
|supportsOpeningTimes|Does this park's API support opening hours?|
|supportsRideSchedules|Does this park return schedules for rides?|
|fastPass|Does this park have fastPass (or a fastPass-style service)?|
|fastPassReturnTimes|Does this park tell you the fastPass return times?|
|timeNow([momentjs date format])|Current time at this park (optional momentjs date format to return time in)|
|dateNow([momentjs date format])|Current date at this park (optional momentjs date format to return date in)|
|UserAgent|The HTTP UserAgent this park is using to make API requests (usually randomly generated per-park at runtime)|

    const ThemeParks = require('themeparks');

    // print each park's name, current location, and timezone
    for (let park in ThemeParks.Parks) {
      const ParkClass = ThemeParks.Parks[park];
      console.log("* " + ParkClass.parkName + " [" + ParkClass.location.toString() + "]: (" + ParkClass.timezone + ")");
    }

Prints:

<!-- START_PARK_TIMEZONE_LIST -->

* Magic Kingdom - Walt Disney World Florida [(28°23′6.72″N, 81°33′50.04″W)]: (America/New_York)
* Epcot - Walt Disney World Florida [(28°22′28.92″N, 81°32′57.84″W)]: (America/New_York)
* Hollywood Studios - Walt Disney World Florida [(28°21′27.00″N, 81°33′29.52″W)]: (America/New_York)
* Animal Kingdom - Walt Disney World Florida [(28°21′19.08″N, 81°35′24.36″W)]: (America/New_York)
* Magic Kingdom - Disneyland Resort [(33°48′36.39″N, 117°55′8.30″W)]: (America/Los_Angeles)
* California Adventure - Disneyland Resort [(33°48′31.39″N, 117°55′8.36″W)]: (America/Los_Angeles)
* Magic Kingdom - Disneyland Paris [(48°52′13.16″N, 2°46′46.82″E)]: (Europe/Paris)
* Walt Disney Studios - Disneyland Paris [(48°52′5.78″N, 2°46′50.59″E)]: (Europe/Paris)
* Magic Kingdom - Shanghai Disney Resort [(31°8′35.88″N, 121°39′28.80″E)]: (Asia/Shanghai)
* Tokyo Disney Resort - Magic Kingdom [(35°38′5.45″N, 139°52′45.46″E)]: (Asia/Tokyo)
* Tokyo Disney Resort - Disney Sea [(35°37′37.40″N, 139°53′20.75″E)]: (Asia/Tokyo)
* Hong Kong Disneyland [(22°18′47.52″N, 114°2′40.20″E)]: (Asia/Hong_Kong)
* Universal Studios Florida [(28°28′29.94″N, 81°27′59.39″W)]: (America/New_York)
* Universal's Islands Of Adventure [(28°28′20.07″N, 81°28′4.28″W)]: (America/New_York)
* Universal Volcano Bay [(28°27′44.28″N, 81°28′14.52″W)]: (America/New_York)
* Universal Studios Hollywood [(34°8′14.14″N, 118°21′19.86″W)]: (America/Los_Angeles)
* Universal Studios Singapore [(1°15′15.30″N, 103°49′25.67″E)]: (Asia/Singapore)
* Europa Park [(48°16′8.15″N, 7°43′17.61″E)]: (Europe/Berlin)
* Six Flags Over Texas [(32°45′17.95″N, 97°4′13.33″W)]: (America/Chicago)
* Six Flags Over Georgia [(33°46′14.08″N, 84°33′5.36″W)]: (America/New_York)
* Six Flags St. Louis [(38°30′47.61″N, 90°40′30.69″W)]: (America/Chicago)
* Six Flags Great Adventure [(40°8′55.18″N, 74°26′27.69″W)]: (America/New_York)
* Six Flags Magic Mountain [(34°25′24.46″N, 118°35′42.90″W)]: (America/Los_Angeles)
* Six Flags Great America [(42°22′12.88″N, 87°56′9.30″W)]: (America/Chicago)
* Six Flags Fiesta Texas [(29°35′59.28″N, 98°36′32.50″W)]: (America/Chicago)
* Six Flags Hurricane Harbor, Arlington [(32°45′23.40″N, 97°3′56.88″W)]: (America/Chicago)
* Six Flags Hurricane Harbor, Los Angeles [(34°25′25.86″N, 118°35′42.05″W)]: (America/Los_Angeles)
* Six Flags America [(38°54′4.46″N, 76°46′16.59″W)]: (America/New_York)
* Six Flags Discovery Kingdom [(38°8′19.43″N, 122°13′59.70″W)]: (America/Los_Angeles)
* Six Flags New England [(42°2′16.54″N, 72°36′55.92″W)]: (America/New_York)
* Six Flags Hurricane Harbor, Jackson [(40°8′18.24″N, 74°26′25.80″W)]: (America/New_York)
* The Great Escape [(43°21′1.80″N, 73°41′32.10″W)]: (America/New_York)
* Six Flags White Water, Atlanta [(33°57′32.86″N, 84°31′10.37″W)]: (America/New_York)
* Six Flags México [(19°17′43.40″N, 99°12′41.19″W)]: (America/Mexico_City)
* La Ronde, Montreal [(45°31′19.18″N, 73°32′4.48″W)]: (America/Toronto)
* Six Flags Hurricane Harbor, Oaxtepec [(18°53′48.12″N, 98°58′31.44″W)]: (America/Mexico_City)
* Alton Towers [(52°59′27.83″N, 1°53′32.25″W)]: (Europe/London)
* Thorpe Park [(51°24′19.80″N, 0°30′37.80″W)]: (Europe/London)
* Chessington World Of Adventures [(51°20′58.56″N, 0°18′52.45″W)]: (Europe/London)
* Parc-Asterix [(49°8′9.75″N, 2°34′21.96″E)]: (Europe/Paris)
* Hershey Park [(40°17′15.65″N, 76°39′30.88″W)]: (America/New_York)
* Silver Dollar City [(36°40′5.44″N, 93°20′18.84″W)]: (America/Chicago)
* Dollywood [(35°47′43.18″N, 83°31′51.19″W)]: (America/New_York)
* Knott's Berry Farm [(33°50′39.12″N, 117°59′54.96″W)]: (America/Los_Angeles)
* Cedar Point [(41°28′42.24″N, 82°40′45.48″W)]: (America/New_York)
* Carowinds [(35°6′16.20″N, 80°56′21.84″W)]: (America/New_York)
* Canada's Wonderland [(43°50′34.80″N, 79°32′20.40″W)]: (America/Toronto)
* Kings Island [(39°20′40.92″N, 84°16′6.96″W)]: (America/New_York)
* Efteling [(51°38′59.67″N, 5°2′36.82″E)]: (Europe/Amsterdam)

<!-- END_PARK_TIMEZONE_LIST -->

## Development

### Building

This project is using ES6 features, which can't be used by legacy version of NodeJS. We're also using "import", which is not available in NodeJS.

So, the project needs to be built into regular JavaScript to work with the older NodeJS versions. This is done by running ``npm run build``

This will compile everything in source/ into dist/.

By running ``npm run build-dev``,

building will also create sourcemaps, so any stacktraces will point to the original code in the source/ directory.

### Running Tests

themeparks supports mocha unit tests. Install mocha with npm install -g mocha

Run the following to test the library's unit tests (this will build the library and then run functional offline unit tests):

    npm test

You can also run unit tests against the source js files using ```npm run testdev```.

There is a separate test for checking the library still connects to park APIs correctly. This is the "online test".

    npm run testonline

You can also test an individual park using the PARKID environment variable, for example:

    PARKID=UniversalStudiosFlorida npm run testonline

### Debug Mode

Themeparks supports the standard NODE_DEBUG environment variable. Pass the name of the library into NODE_DEBUG to turn on debug mode:

    NODE_DEBUG=themeparks npm run testonline

Environment variables can be combined:

    NODE_DEBUG=themeparks PARKID=UniversalStudiosFlorida npm run testonline
