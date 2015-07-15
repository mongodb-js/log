var parse = require('../');
var line = 'Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-';
console.log('`' + line + '` → ', JSON.stringify(parse(line), null, 2));

// Prints out:
//
//   `Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-` →  [
//     {
//       "timestamp": "Wed Mar 12 14:42:31",
//       "message": "db version v2.5.6-pre-",
//       "line": "Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-",
//       "thread": "initandlisten",
//       "timestamp_format": "ctime-pre2.4",
//       "_id": "initandlisten:Wed Mar 12 14:42:31",
//       "stats": {}
//     }
//   ]
