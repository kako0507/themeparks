

// this is a basic wrapper for making Request() requests
//  we wrap this so we can have the same debug information for all requests

const _ = require('lodash');
const needle = require('needle');

// get our project log function for writing log output
const log = require('./debugPrint');

// include our Promise library
const Promise = require('./promise');

/**
 * Make a network request
 * @private
 * @param parameters to pass to request library
 */
function makeRequest(networkRequest) {
  if (arguments.length !== 1) {
    return Promise.reject(new Error('HTTP requires 1 argument. The network object configuration'));
  }

  // debug log if we're in debug mode
  log(`Making request to ${networkRequest.url}`);

  // grab method from the request (we'll call .[method] directly using the needle library)
  const requestMethod = networkRequest.method || 'get';

  // extract the required URL
  const requestURL = networkRequest.url;
  if (!requestURL) return Promise.reject(new Error(`No URL defined for ${requestMethod} request`));

  const requestData = networkRequest.data || networkRequest.body || {};

  // build-in retires into this wrapper (default 3)
  const retries = networkRequest.retries || 3;
  // un-set retries in-case request suddenly supports this or something!

  // default delay of 2 seconds for each retry attempt
  const retryDelay = networkRequest.retryDelay || 2000;

  // we will default to returning the body, but can return the full response object if we want
  const returnFullResponse = networkRequest.returnFullResponse || false;

  // add ability to force responses into JSON objects,
  // even if they don't return application/json content header
  let forceJSON = networkRequest.forceJSON || false;

  // return result as a Promise!
  return new Promise((resolve, reject) => {
    let attempt = 0;

    // make request in an anonymouse function so we can make multiple requests to it easily
    const attemptRequest = () => {
      log(`Calling ${requestMethod}:${requestURL}`);

      // build Needle request
      needle.request(
        requestMethod,
        requestURL,
        requestData,
        _.omit(networkRequest, [
          'method',
          'url',
          'data',
          'body',
          'retries',
          'retryDelay',
          'returnFullResponse',
          'forceJSON',
        ]),
        (err, resp) => {
          if (err || resp.statusCode >= 400 || (resp.statusCode === 200 && !resp.body)) {
            log(`Network request failed attempt ${attempt}/${retries} for URL ${requestURL}`);
            log(err || (`${resp.statusCode}: ${JSON.stringify(resp.body, null, 2)}`));

            // if we have retires left, try again!
            attempt += 1;
            if (attempt < retries) {
              // try again after retryDelay milliseconds
              setTimeout(attemptRequest, retryDelay);
              return;
            }
            reject(err || (`${resp.statusCode}: ${JSON.stringify(resp.body, null, 2)}`));
            return;
          }

          // no error! return the result
          if (returnFullResponse) {
            log(`Successfully fetched response for URL ${requestURL}`);
            resolve(resp);
            return;
          }
          // enable "forceJSON" if the return header type is "application/json"
          if (resp.headers && resp.headers['content-type'] && resp.headers['content-type'].indexOf('application/json') >= 0) {
            log("Found 'application/json' header from in HTTP request, parsing JSON data");
            forceJSON = true;
          }

          // if we want to force JSON (and we're not already a JSON object!)
          if (
            forceJSON &&
            resp.body.constructor !== {}.constructor &&
            resp.body.constructor !== [].constructor
          ) {
            let JSONData = null;
            try {
              JSONData = JSON.parse(resp.body);
            } catch (e) {
              log(`Error pasing JSON data: ${e}`);
              JSONData = null;
            }

            if (JSONData === null) {
              // if we have retires left, try again!
              attempt += 1;
              if (attempt < retries) {
                // try again after retryDelay milliseconds
                setTimeout(attemptRequest, retryDelay);
                return;
              }
              reject(new Error(`Unable to parse ${resp.body} into a JSON object`));
              return;
            }

            log(`Successfully fetched and parsed JSON from response at ${requestURL}`);
            resolve(JSONData);
            return;
          }
          log(`Successfully fetched body for URL ${requestURL}`);
          resolve(resp.body);
        },
      );
    };

    // make first request attempt
    process.nextTick(attemptRequest);
  });
}

module.exports = makeRequest;
