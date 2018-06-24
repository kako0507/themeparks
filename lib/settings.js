import cacheManager from 'cache-manager';
import memoryStore from 'cache-manager/lib/stores/memory';

export default {
  // cache system (see https://github.com/BryanDonovan/node-cache-manager)
  cache: cacheManager.caching({
    store: memoryStore,
    max: 5000,
    ttl: 60 * 60,
  }),
  // default request timeout values
  defaultOpenTimeout: 10000, // 10 seconds; timeout in milliseconds
  defaultReadTimeout: 0, // 0 seconds; timeout in milliseconds
  // socks proxy url to use
  proxyUrl: null, // e.g. "socks://127.0.0.1:1080"
  // default Park settings
  defaultParkName: 'Default Park',
  defaultParkTimezone: 'Europe/London',
  defaultParkTimeFormat: null,
  // cache settings (in seconds)
  defaultCacheWaitTimesLength: 60 * 5, // 5 minutes
  defaultCacheOpeningTimesLength: 60 * 60, // 1 hour
  // number of days to return for opening time schedules
  defaultScheduleDays: 30,
  // default time return format
  defaultTimeFormat: 'YYYY-MM-DDTHH:mm:ssZ',
  // default date return format
  defaultDateFormat: 'YYYY-MM-DD',
};
