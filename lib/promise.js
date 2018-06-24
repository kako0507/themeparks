// make our own wrapper for Promise so we can configure bluebird exactly how we want it everywhere
import Promise from 'bluebird';

// handle errors from within Promises correctly!
//  Promises by default just die if there is an error, which makes debugging the worst thing ever.
//  who decided that was sane?
Promise.onPossiblyUnhandledRejection((error) => {
  throw error;
});

export default Promise;
