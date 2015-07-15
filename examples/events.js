var parse = require('../');
console.log('i even understand events! → ', JSON.stringify(parse(
  '2014-05-16T10:50:13.450-0400 [initandlisten] recover : no journal files present, no recovery needed',
  '2014-05-16T10:50:13.579-0400 [initandlisten] waiting for connections on port 27017'
), null, 2));

// Prints out:
//
//   i even understand events! →  [
//     {
//       "timestamp": "2014-05-16T10:50:13.450-0400",
//       "message": "recover : no journal files present, no recovery needed",
//       "line": "2014-05-16T10:50:13.450-0400 [initandlisten] recover : no journal files present, no recovery needed",
//       "thread": "initandlisten",
//       "timestamp_format": "iso8601-local",
//       "_id": "initandlisten:2014-05-16T10:50:13.450-0400",
//       "stats": {}
//     },
//     {
//       "timestamp": "2014-05-16T10:50:13.579-0400",
//       "message": "waiting for connections on port 27017",
//       "line": "2014-05-16T10:50:13.579-0400 [initandlisten] waiting for connections on port 27017",
//       "thread": "initandlisten",
//       "event": {
//         "name": "ready",
//         "data": {
//           "port": 27017
//         }
//       },
//       "timestamp_format": "iso8601-local",
//       "_id": "initandlisten:2014-05-16T10:50:13.579-0400",
//       "stats": {}
//     }
//   ]
