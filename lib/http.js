// this is a basic wrapper for making Request() requests
//  we wrap this so we can have the same debug information for all requests
import _ from 'lodash';
// to make HTTP request
import axios from 'axios';
// query string library
import qs from 'qs';
// get our project log function for writing log output
import log from './debugPrint';
// include our Promise library
import Promise from './promise';

/**
 * Make a network request
 * @private
 * @param parameters to pass to request library
 */
function makeRequest(networkRequest) {
  if (arguments.length !== 1) {
    return Promise.reject(new Error('HTTP requires 1 argument. The network object configuration'));
  }

  // grab method from the request (we'll call .[method] directly using the needle library)
  const requestMethod = networkRequest.method || 'get';

  // extract the required URL
  const { url } = networkRequest;
  if (!url) return Promise.reject(new Error(`No URL defined for ${requestMethod} request`));

  // debug log if we're in debug mode
  log(`Making request to ${url}`);

  const headers = _.mapKeys(networkRequest.headers, (header, key) => key.toLowerCase());

  // build-in retires into this wrapper (default 3)
  const retries = networkRequest.retries || 3;
  // un-set retries in-case request suddenly supports this or something!

  // default delay of 2 seconds for each retry attempt
  const retryDelay = networkRequest.retryDelay || 2000;

  // we will default to returning the body, but can return the full response object if we want
  const returnFullResponse = networkRequest.returnFullResponse || false;

  let inputData = {};
  if (networkRequest.data) {
    if (!requestMethod || requestMethod.toLowerCase() === 'get') {
      inputData = { params: networkRequest.data };
    } else if (headers['content-type'] && headers['content-type'].includes('application/x-www-form-urlencoded')) {
      inputData = { data: qs.stringify(networkRequest.data) };
    } else {
      inputData = { data: networkRequest.data };
    }
  }

  let { agent } = networkRequest;
  if (agent) {
    if (networkRequest.url.startsWith('https://')) {
      agent = { httpsAgent: agent };
    } else {
      agent = { httpAgent: agent };
    }
  } else {
    agent = {};
  }

  // add ability to force responses into JSON objects,
  // even if they don't return application/json content header
  let forceJSON = networkRequest.forceJSON || false;

  // return result as a Promise!
  return new Promise((resolve, reject) => {
    let attempt = 0;

    // make request in an anonymouse function so we can make multiple requests to it easily
    const attemptRequest = () => {
      log(`Calling ${requestMethod}:${url}`);

      axios({
        ..._.omit(networkRequest, [
          'retries',
          'retryDelay',
          'returnFullResponse',
          'data',
          'agent',
          'forceJSON',
        ]),
        ...inputData,
        ...agent,
        // headers,
      })
        .then((response) => {
          // no error! return the result
          if (returnFullResponse) {
            log(`Successfully fetched response for URL ${url}`);
            resolve(response);
            return;
          }
          // enable "forceJSON" if the return header type is "application/json"
          if (
            response.headers &&
            response.headers['content-type'] &&
            response.headers['content-type'].indexOf('application/json') >= 0
          ) {
            log("Found 'application/json' header from in HTTP request, parsing JSON data");
            forceJSON = true;
          }

          // if we want to force JSON (and we're not already a JSON object!)
          if (
            forceJSON &&
            response.data.constructor !== {}.constructor &&
            response.data.constructor !== [].constructor
          ) {
            let JSONData = null;
            try {
              JSONData = JSON.parse(response.data);
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
              reject(new Error(`Unable to parse ${response.data} into a JSON object`));
              return;
            }

            log(`Successfully fetched and parsed JSON from response at ${url}`);
            resolve(JSONData);
            return;
          }
          log(`Successfully fetched body for URL ${url}`);
          resolve(response.data);
        })
        .catch((error) => {
          reject(error);
        });
    };

    // make first request attempt
    process.nextTick(attemptRequest);
  });
}

export default makeRequest;
