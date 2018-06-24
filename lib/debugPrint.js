// use standard NodeJS debug log function
import util from 'util';
import debug from './debug';

const debuglog = util.debuglog(debug.ModuleName);

export default debuglog;
