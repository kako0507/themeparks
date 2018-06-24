/**
 * Very simple wrapper around node-cache-manager
 */
import settings from './settings';

const symbolPrefix = Symbol('prefix used for this caching instance');

// Internal wrap helper to not copy/paste logic for global and local-scope wraps
function wrap(key, setFunction, _cacheGetter, _cacheSetter, ttl) {
  return new Promise((resolve, reject) => {
    // attempt to get the requested key (note, no prefix here, it's attached in the Get function)
    //  pass success directly through to resolve
    _cacheGetter.bind(this)(key).then(resolve, () => {
      // if cache miss, call the setFunction to get the new value we want
      setFunction().then((dataToCache) => {
        // work out ttl
        const options = {};
        if (ttl) {
          //  if it's a function, call the function to get the required ttl
          options.ttl = typeof ttl === 'function'
            ? ttl()
            : ttl;
        }

        // store in cache
        _cacheSetter.bind(this)(key, dataToCache, options).then(() => {
          // resolve with newly cached data
          resolve(dataToCache);
        }, reject);
      }, reject);
    });
  });
}

class Cache {
  /**
   * Create Cache object
   * This object will handle caching data for later use
   * @param {Object} [options]
   * @param {String} [options.prefix] Preface to prepend to all cache keys for this instance
   */
  constructor(options = {}) {
    // setup cache configuration
    this[symbolPrefix] = options.prefix || '';
  }

  /**
   * Get a globally cached value
   * This is identical to Get,
   * but the requested key will be in scope of the entire library,
   * not just the park that requests the data
   * @name Cache.getGlobal
   * @param {String} key Key to request associated data for
   * @returns {Promise<Object>}
   * Returns Promise resolved if data found, rejects if data is not in cache
   */
  static getGlobal(key) {
    return new Promise((resolve, reject) => {
      // prepend the prefix to the requested key
      settings.cache.get(`themeparks_${key}`, (err, result) => {
        // reject promise on failure
        if (err) return reject(err);
        // reject on no data returned
        if (result === undefined || result === null) return reject();

        // resolve promise on successful data
        return resolve(result);
      });
    });
  }

  /**
   * Set a cached value library-wide
   * Idential to Set, but cached at a library level instead of for the owning park
   * @name Cache.setGlobal
   * @param {String} key Key to set data for
   * @param {Object} data Data to store in cache
   * @param {Object} [options] Additional options for caching (see node-cache-manager)
   * @returns {Promise} Returns Promise resolving if cached data was successfully set
   */
  static setGlobal(key, data, options = {}) {
    return new Promise((resolve, reject) => {
      // prepend prefix to key setting
      settings.cache.set(`themeparks_${key}`, data, options, (err) => {
        // if failure, reject Promise
        if (err) reject(err);
        // other, resolve
        else resolve();
      });
    });
  }

  /**
   * Get the prefix used for this caching instance
   * @returns {String} Cache key prefix
   */
  get Prefix() {
    return `${this[symbolPrefix]}_`;
  }

  /**
   * Get a cached value
   * @param {String} key Key to request associated data for
   * @returns {Promise<Object>}
   * Returns Promise resolved if data found, rejects if data is not in cache
   */
  getCachedValue(key) {
    // prepend our key to restrict our request to our park's cache (avoid conflicts with other APIs)
    return this.constructor.getGlobal(this.Prefix + key);
  }

  /**
   * Set a cached value
   * @param {String} key Key to set data for
   * @param {Object} data Data to store in cache
   * @param {Object} [options] Additional options for caching (see node-cache-manager)
   * @returns {Promise} Returns Promise resolving if cached data was successfully set
   */
  setCachedValue(key, data, options = {}) {
    // add our prefix and pass onto the setGlobal function
    return this.constructor.setGlobal(this.Prefix + key, data, options);
  }

  /**
   * Wrap a get request and pass a setter to tidy up the usual get/set boilerplate
   * @param {String} key Key to get/set
   * @param {Function} setFunction
   * Function to set data if it is missing from the cache.
   * setFunction should return a Promise
   * @param {Number|Function} [ttl]
   * How long cached result should last.
   * Can be a number (seconds) or a function that will return a value
   */
  wrap(key, setFunction, ttl) {
    return wrap.bind(this)(key, setFunction, this.getCachedValue, this.setCachedValue, ttl);
  }

  /**
   * Wrap a get request and pass a setter to tidy up the usual get/set boilerplate.
   * This version sits in the global scope, rather than per-park.
   * @param {String} key Key to get/set
   * @param {Function} setFunction
   * Function to set data if it is missing from the cache.
   * setFunction should return a Promise
   * @param {Number|Function} [ttl]
   * How long cached result should last.
   * Can be a number (seconds) or a function that will return a value
   */
  wrapGlobal(key, setFunction, ttl) {
    return wrap.bind(this)(
      key,
      setFunction,
      this.constructor.getGlobal,
      this.constructor.setGlobal,
      ttl,
    );
  }
}

// create new cache object and export it
export default Cache;
