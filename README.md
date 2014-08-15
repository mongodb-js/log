# mongodb-log

[![build status](https://secure.travis-ci.org/imlucas/mongodb-log.png)](http://travis-ci.org/imlucas/mongodb-log)

Turn mongod log entries to nice objects that are easy to work with.

## Example

```javascript
var parseLog = require('mongodb-log').parse,
  line = 'Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-';

console.log('`' +line + '` → ', parseLog(line));

var lines = [
  '2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22 connections now open)',
  '2014-05-16T10:43:24.840-0400 [clientcursormon] mem (MB) res:9 virt:3514',
  '2014-05-16T10:43:24.840-0400 [clientcursormon]  mapped (incl journal view):960',
  '2014-05-16T10:43:24.840-0400 [clientcursormon]  connections:22',
  '2014-05-16T10:48:24.926-0400 [clientcursormon] mem (MB) res:9 virt:3514',
  '2014-05-16T10:48:24.926-0400 [clientcursormon]  mapped (incl journal view):960',
  '2014-05-16T10:48:24.926-0400 [clientcursormon]  connections:22'
];

console.log('lots of lines → ', parseLog(lines));

console.log('i even understand events! → ', parseLog([
  '2014-05-16T10:50:13.450-0400 [initandlisten] recover : no journal files present, no recovery needed',
  '2014-05-16T10:50:13.579-0400 [initandlisten] waiting for connections on port 27017'
]));

```

will output

```
`Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-` →  [
  {
    name: 'initandlisten',
    message: 'db version v2.5.6-pre-',
    date: 'Wed Mar 12 14:42:31',
    event: null
  }
]

lots of lines →  [
  { name: 'conn611',
    message: 'end connection 127.0.0.1:57499 (22 connections now open)',
    date: '2014-05-16T10:39:00.938-0400',
    event: null },
  { name: 'clientcursormon',
    message: 'mem (MB) res:9 virt:3514',
    date: '2014-05-16T10:43:24.840-0400',
    event: null },
  { name: 'clientcursormon',
    message: ' mapped (incl journal view):960',
    date: '2014-05-16T10:43:24.840-0400',
    event: null },
  { name: 'clientcursormon',
    message: ' connections:22',
    date: '2014-05-16T10:43:24.840-0400',
    event: null },
  { name: 'clientcursormon',
    message: 'mem (MB) res:9 virt:3514',
    date: '2014-05-16T10:48:24.926-0400',
    event: null },
  { name: 'clientcursormon',
    message: ' mapped (incl journal view):960',
    date: '2014-05-16T10:48:24.926-0400',
    event: null },
  { name: 'clientcursormon',
    message: ' connections:22',
    date: '2014-05-16T10:48:24.926-0400',
    event: null }
]

i even understand events! →  [
  { name: 'initandlisten',
    message: 'recover : no journal files present, no recovery needed',
    date: '2014-05-16T10:50:13.450-0400',
    event: null },
  { name: 'initandlisten',
    message: 'waiting for connections on port 27017',
    date: '2014-05-16T10:50:13.579-0400',
    event: { name: 'ready', data: {port: 27017} } }
]
```

## license

MIT
