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

## MongoDB Log Format In-Depth

### Elements to extract from log files

#### General

All log lines have these general values.

##### Timestamps

There are 4 datetime formats that need to be supported.

| Datetime Format |            Example             | MongoDB Version |
| --------------- | ------------------------------ | --------------- |
| ctime           | `Wed Dec 31 19:00:00.000`      | 2.4             |
| ctime-pre2.4    | `Wed Dec 31 19:00:00`          | < 2.4           |
| iso8601-local   | `1969-12-31T19:00:00.000+0500` | 2.6             |
| iso8601-utc     | `1970-01-01T00:00:00.000Z`     | 2.6             |

They are at the beginning of a log line. The regex capture groups to be
extracted are:

- `timestamp`
- `timestamp_format`


##### Threads / Connections

The `thread` is listed in square brackets after the timestamp. The example
below shows two lines with threads `conn611` and `initandlisten`.

```
2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22
connections now open)
2014-05-16T10:50:13.450-0400 [initandlisten] recover : no journal files present,
 no recovery needed
```

The regex capture group is `thread`.

Each connection is its own thread, for example `conn611` above. While
everything happening on that connection (including its end, see example above)
has the correct thread name, the opening of the connection is handled by the
`initandlisten` thread (in mongod) and the `mongosMain` thread (in mongos).
It's often interesting to know when a certain connection was opened.
Therefore, a second regex capture named `conn` is exposed, that returns the
connection name even for the "connection accepted" log line. The connection
name can be extracted from the `#<number>` value after the IP address and
port.

Example:

```
2014-05-31T14:21:14.734-0400 [initandlisten] connection accepted from
127.0.0.1:51786 #14 (3 connections now open)
2014-05-31T14:21:14.734-0400 [conn14] command admin.$cmd command: isMaster
{ ismaster: 1 } keyUpdates:0 numYields:0  reslen:371 0ms
2014-05-31T14:21:14.735-0400 [conn14] end connection 127.0.0.1:51786 (2
connections now open)
```

| line ## |    `thread`   | `conn` |
| ------ | ------------- | ------ |
|      1 | initandlisten | conn14 |
|      2 | conn14        | conn14 |
|      3 | conn14        | conn14 |

#### Operations

Some log lines are "operations" (query, getmore, update, delete, command).
These do not match up with the `OP_*` opcodes of the wire protocol (e.g.
commands are queries on a special `.$cmd` collection), but should be seen as
"logical" operations. Operations have a type (query, getmore, update, delete,
command), a namespace on which the operation is executed and a duration in
milliseconds.

namespace format:
namespace = {{ database name }}.{{ collection name }}
- database names cannot have a "."
- anything after the first "." is the collection name
  - the collection name also includes the index name
    - index name being of ${{ index name }}
  e.g. admin.system.system1.system.$index
    database   = "admin",
    collection = "system.system1.system2.$index",
    index = "index"

The exposed regex capture groups are `operation`, `namespace`, `database`,
`collection`, `duration` and `index`.

Some other events do not follow the operations pattern but still have a
duration that is useful to extract, for example:

```
Tue Jan 28 21:46:14.886 [DataFileSync] flushing mmaps took 10973ms  for 21
files
```

The `duration` of these lines should also be extracted (here 10973
milliseconds) and exposed via the `duration` name.


##### Queries, Updates, Deletes

Query operations, as well as updates and deletes, have a `query` part to match
a subset of documents. Example:

```
2014-05-31T14:20:56.002-0400 [conn16] query test.coll query: { query: { foo:
"value", bar: "another value" }, orderby: { number: -1.0 } } planSummary: EOF
ntoreturn:0 ntoskip:0 keyUpdates:0 numYields:0 locks(micros) r:106 nreturned:0
reslen:20 12ms
```

The query here is `{ foo: "value", bar: "another value" }`. The query shape of
this query is `{ foo: 1, bar: 1}`. The sort shape is `{ number: -1.0 }` (sorts
are always represented as shape, with only 1 or -1 as valid values).

The regex capture groups to extract are `query` (full query with values),
`query_shape`, `sort_shape`.


##### Operation Stats

Some operations (mostly CRUD operations) return values for the following
counters, which should be exposed as well:

*  `nscanned`
*  `ntoreturn`
*  `ntoskip`
*  `nupdated`
*  `nreturned`
*  `ninserted`
*  `ndeleted`
*  `nmoved`
*  `numYields`

##### Locks

Some operations require to take read/write locks. These lock times are
measured in microseconds. They follow this pattern (an operation either prints
read `r` or write `w` lock times, but not both).

```
locks(micros) r:106
```

In this case, the read lock was held for 106 microseconds.

The regex capture groups are `r` and `w`.


#### Events

MongoDB logs a large number of unstructured event lines, that follow the
simple pattern
```
{{timestamp}} [{{thread}}] {{description}}
```

Some of these events are generally more useful for issue diagnosis and should
be extracted, for example

* Start and termination of the server
* Index builds (start, progress, end)
* ...

Events have an event name (for example "ready", "index", ...) and optionally
some data specific to the event. They are returned as a document of the form
`{"name": "index", "data": { ... }`.

### Full list of names to extract

- [x] `R`
- [x] `W`
- [x] `timestamp`
- [x] `timestamp_format`
- [x] `thread`
- [x] `conn`
- [x] `operation`
- [x] `namespace`
- [x] `database`
- [x] `collection`
- [x] `duration`
- [x] `query`
- [ ] `query_shape`
- [x] `sort_shape`
- [x] `index`
- [x] `nscanned`
- [x] `ntoreturn`
- [x] `ntoskip`
- [x] `nupdated`
- [x] `nreturned`
- [x] `ninserted`
- [x] `ndeleted`
- [x] `nmoved`
- [x] `numYields`
- [x] `r`
- [x] `w`
- [ ] `event`
