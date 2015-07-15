var parse = require('../');
var lines = [
  '2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22 connections now open)',
  '2014-05-16T10:43:24.840-0400 [clientcursormon] mem (MB) res:9 virt:3514',
  '2014-05-16T10:43:24.840-0400 [clientcursormon]  mapped (incl journal view):960',
  '2014-05-16T10:43:24.840-0400 [clientcursormon]  connections:22',
  '2014-05-16T10:48:24.926-0400 [clientcursormon] mem (MB) res:9 virt:3514',
  '2014-05-16T10:48:24.926-0400 [clientcursormon]  mapped (incl journal view):960',
  '2014-05-16T10:48:24.926-0400 [clientcursormon]  connections:22'
];
console.log('lots of lines → ', JSON.stringify(parse(lines), null, 2));

// Prints out:
//
//   lots of lines →  [
//     [
//       {
//         "timestamp": "2014-05-16T10:39:00.938-0400",
//         "message": "end connection 127.0.0.1:57499 (22 connections now open)",
//         "line": "2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22 connections now open)",
//         "thread": "conn611",
//         "timestamp_format": "iso8601-local",
//         "connection_id": "conn611",
//         "_id": "conn611:2014-05-16T10:39:00.938-0400",
//         "stats": {}
//       },
//       {
//         "timestamp": "2014-05-16T10:43:24.840-0400",
//         "message": "mem (MB) res:9 virt:3514",
//         "line": "2014-05-16T10:43:24.840-0400 [clientcursormon] mem (MB) res:9 virt:3514",
//         "thread": "clientcursormon",
//         "timestamp_format": "iso8601-local",
//         "_id": "clientcursormon:2014-05-16T10:43:24.840-0400",
//         "stats": {}
//       },
//       {
//         "timestamp": "2014-05-16T10:43:24.840-0400",
//         "message": " mapped (incl journal view):960",
//         "line": "2014-05-16T10:43:24.840-0400 [clientcursormon]  mapped (incl journal view):960",
//         "thread": "clientcursormon",
//         "timestamp_format": "iso8601-local",
//         "_id": "clientcursormon:2014-05-16T10:43:24.840-0400",
//         "stats": {}
//       },
//       {
//         "timestamp": "2014-05-16T10:43:24.840-0400",
//         "message": " connections:22",
//         "line": "2014-05-16T10:43:24.840-0400 [clientcursormon]  connections:22",
//         "thread": "clientcursormon",
//         "timestamp_format": "iso8601-local",
//         "_id": "clientcursormon:2014-05-16T10:43:24.840-0400",
//         "stats": {}
//       },
//       {
//         "timestamp": "2014-05-16T10:48:24.926-0400",
//         "message": "mem (MB) res:9 virt:3514",
//         "line": "2014-05-16T10:48:24.926-0400 [clientcursormon] mem (MB) res:9 virt:3514",
//         "thread": "clientcursormon",
//         "timestamp_format": "iso8601-local",
//         "_id": "clientcursormon:2014-05-16T10:48:24.926-0400",
//         "stats": {}
//       },
//       {
//         "timestamp": "2014-05-16T10:48:24.926-0400",
//         "message": " mapped (incl journal view):960",
//         "line": "2014-05-16T10:48:24.926-0400 [clientcursormon]  mapped (incl journal view):960",
//         "thread": "clientcursormon",
//         "timestamp_format": "iso8601-local",
//         "_id": "clientcursormon:2014-05-16T10:48:24.926-0400",
//         "stats": {}
//       },
//       {
//         "timestamp": "2014-05-16T10:48:24.926-0400",
//         "message": " connections:22",
//         "line": "2014-05-16T10:48:24.926-0400 [clientcursormon]  connections:22",
//         "thread": "clientcursormon",
//         "timestamp_format": "iso8601-local",
//         "_id": "clientcursormon:2014-05-16T10:48:24.926-0400",
//         "stats": {}
//       }
//     ]
//   ]
