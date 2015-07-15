# mongodb-log [![][npm_img]][npm_url] [![][travis_img]][travis_url] [![][coverage_img]][coverage_url] [![][gitter_img]][gitter_url]

Normalize MongoDB log entries into objects that make sense.

## Installation

```bash
npm install mongodb-log
```

## Examples

```javascript
var parse = require('mongodb-log');
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
```

```javascript
var parse = require('mongodb-log');
var entries = [
  '2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22 connections now open)',
  '2014-05-16T10:43:24.840-0400 [clientcursormon] mem (MB) res:9 virt:3514',
  '2014-05-16T10:43:24.840-0400 [clientcursormon]  mapped (incl journal view):960',
  '2014-05-16T10:43:24.840-0400 [clientcursormon]  connections:22',
  '2014-05-16T10:48:24.926-0400 [clientcursormon] mem (MB) res:9 virt:3514',
  '2014-05-16T10:48:24.926-0400 [clientcursormon]  mapped (incl journal view):960',
  '2014-05-16T10:48:24.926-0400 [clientcursormon]  connections:22'
];
console.log('lots of entries → ', JSON.stringify(parse(entries), null, 2));

// Prints out:
//
//   lots of entries →  [
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
```

```javascript
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
```

## API

```javascript
var parse = require('mongodb-log')
parse(entries);
```
#### parse(entries)

Returns an array of [`LogEntry`][LogEntry] instances.

#### parse()

Returns a transform stream you can pipe the contents of log files into:

```javascript
var parse = require('mongodb-log');
var fs = require('fs');
var es = require('event-stream');

fs.createReadStream('/var/log/mongodb/mongod.log')
  .pipe(es.split('\n'))
  .pipe(parse())
  .pipe(fs.createWriteStream('/var/log/mongodb/mongod.json'));
```

### LogEntry

#### `LogEntry.prototype._id`
*String* - Unique identifier for this entry. `concat(timestamp, thread)`

#### `LogEntry.prototype.operation`
*String*

Operations have a type (query, getmore, update, delete,
command), a namespace on which the operation is executed and a duration in
milliseconds. These do not match up with the `OP_*` opcodes of the wire protocol (e.g. commands are queries on a special `.$cmd` collection), but should be seen
as "logical" operations. A `namespace=concat(database_name, '.', collection_name)`. See [mongodb-ns][mongodb-ns] for more details on namespaces.

Some other events do not follow the operations pattern but still have a
duration that is useful to extract, for example:

```
Tue Jan 28 21:46:14.886 [DataFileSync] flushing mmaps took 10973ms  for 21 files
```

The `duration` of these entries should also be extracted (here 10973
milliseconds) and exposed via the `duration` name.

#### `LogEntry.prototype.connection_id`
*String*

#### `LogEntry.prototype.thread`
`thread` - *String*

The `thread` is listed in square brackets after the timestamp. The example
below shows two entries with threads `conn611` and `initandlisten`.

```
2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22
connections now open)
2014-05-16T10:50:13.450-0400 [initandlisten] recover : no journal files resent, no recovery needed
```

Each connection is its own thread, for example `conn611` above. While
everything happening on that connection (including its end, see example above)
has the correct thread name, the opening of the connection is handled by the
`initandlisten` thread (in mongod) and the `mongosMain` thread (in mongos).

It's often interesting to know when a certain connection was opened.
Therefore, a second regex capture named `conn` is exposed, that returns the
connection name even for the "connection accepted" log line. The connection
name can be extracted from the `#<number>` value after the IP address and
port. For example:

```
2014-05-31T14:21:14.734-0400 [initandlisten] connection accepted from
127.0.0.1:51786 #14 (3 connections now open)
2014-05-31T14:21:14.734-0400 [conn14] command admin.$cmd command: isMaster
{ ismaster: 1 } keyUpdates:0 numYields:0  reslen:371 0ms
+2014-05-31T14:21:14.735-0400 [conn14] end connection 127.0.0.1:51786 (2 connections now open)
```

| line ## |    `thread`   | `conn` |
| ------ | ------------- | ------ |
|      1 | initandlisten | conn14 |
|      2 | conn14        | conn14 |
|      3 | conn14        | conn14 |

#### `LogEntry.prototype.timestamp_format`

*String*

There are 4 possible formats MongoDB logs use depending on the server's version:

| timestamp_format | MongoDB Version |            Example             |
| ---------------- | --------------- | ------------------------------ |
| ctime            | 2.4             | `Wed Dec 31 19:00:00.000`      |
| ctime-pre2.4     | < 2.4           | `Wed Dec 31 19:00:00`          |
| iso8601-local    | 2.6             | `1969-12-31T19:00:00.000+0500` |
| iso8601-utc      | 2.6             | `1970-01-01T00:00:00.000Z`     |

#### `LogEntry.prototype.event`

*Object*

MongoDB logs a large number of unstructured event entries that follow the
simple pattern:

```
{{timestamp}} [{{thread}}] {{description}}
```

Some of these events are generally more useful for issue diagnosis and should
be extracted, for example

* Start and termination of the server
* Index builds (start, progress, end)
* Map Reduce jobs

Events have an event name (for example "ready", "index", ...) and optionally
some data specific to the event. They are returned as a document of the form
`{"name": "index", "data": { ... }`.

`stats` - *[`OperationStats`](#operationstats)*

#### `LogEntry.prototype.stats`

*OperationStats*

Some operations (mostly CRUD operations) return values for the following:

##### `OperationStats.prototype.to_return_count`
*Number* - `ntoreturn` [Default: `0`].

##### `OperationStats.prototype.to_skip_count`
*Number* `ntoskip` [Default: `0`].

##### `OperationStats.prototype.scanned_count`
*Number* - `nscanned` [Default: `0`].

##### `OperationStats.prototype.scanned_object_count`
*Number* - `nscanned` [Default: `0`].

##### `OperationStats.prototype.key_update_count`
*Number* - [Default: `0`].

##### `OperationStats.prototype.yield_count`
*Number* - `numYields` [Default: `0`].

##### `OperationStats.prototype.returned_count`
*Number*  - `nreturned` [Default: `0`].

##### `OperationStats.prototype.result_length`
*Number* - [Default: `0`].

##### `OperationStats.prototype.moved_count`
*Number* - `nmoved` [Default: `0`].

##### `OperationStats.prototype.deleted_count`
*Number* - `ndeleted` [Default: `0`].

##### `OperationStats.prototype.updated_count`
*Number* - `nupdated` [Default: `0`].

##### `OperationStats.prototype.*_lock_time`

Some operations require to take read/write locks. These lock times are
measured in microseconds. They follow this pattern (an operation either prints
read `r` or write `w` lock times, but not both).  `mongodb-log` maps these to
`read_lock_time` and `write_lock_time` respectively.

```
locks(micros) r:106
```

In this case, the read lock was held for 106 microseconds.

##### `OperationStats.prototype.write_lock_time`
*Number* - `w` as milliseconds [Default: `0`].

##### `OperationStats.prototype.read_lock_time`
*Number* - `r` as milliseconds [Default: `0`].

## License

Apache 2.0

[travis_img]: https://secure.travis-ci.org/mongodb-js/log.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/log
[npm_img]: https://img.shields.io/npm/v/mongodb-log.svg
[npm_url]: https://www.npmjs.org/package/mongodb-log
[coverage_img]: https://coveralls.io/repos/mongodb-js/log/badge.svg?branch=master
[coverage_url]: https://coveralls.io/r/mongodb-js/log
[gitter_img]: https://badges.gitter.im/Join%20Chat.svg
[LogEntry]: #logentry
[gitter_url]: https://gitter.im/mongodb-js/mongodb-js
[mongodb-ns]: https://github.com/mongodb-js/ns
