# MongoDB Log Format In-Depth

## Elements to extract from log files

### General

All log lines have these general values.

#### Timestamps

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


#### Threads / Connections

The `thread` is listed in square brackets after the timestamp. The example
below shows two lines with threads `conn611` and `initandlisten`.

```
2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22
connections now open) 2014-05-16T10:50:13.450-0400 [initandlisten] recover :
no journal files present, no recovery needed
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
2014-05-31T14:21:14.734-0400 [conn14] command admin.$cmd command: isMaster { is
master: 1 } keyUpdates:0 numYields:0  reslen:371 0ms 
2014-05-31T14:21:14.735-0400 [conn14] end connection 127.0.0.1:51786 (2 
connections now open)
```

| line # |    `thread`   | `conn` |
| ------ | ------------- | ------ |
|      1 | initandlisten | conn14 |
|      2 | conn14        | conn14 |
|      3 | conn14        | conn14 |

### Operations

Some log lines are "operations" (query, getmore, update, delete, command).
These do not match up with the `OP_*` opcodes of the wire protocol (e.g.
commands are queries on a special `.$cmd` collection), but should be seen as
"logical" operations. Operations have a type (query, getmore, update, delete,
command), a namespace on which the operation is executed (consisting of
database.collection) and a duration in milliseconds.

The exposed regex capture groups are `operation`, `namespace`, `database`,
`collection`, `duration`.

Some other events do not follow the operations pattern but still have a
duration that is useful to extract, for example:

```
Tue Jan 28 21:46:14.886 [DataFileSync] flushing mmaps took 10973ms  for 21
files
```

The `duration` of these lines should also be extracted (here 10973
milliseconds) and exposed via the `duration` name.


#### Queries, Updates, Deletes

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


#### Operation Stats

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

#### Locks

Some operations require to take read/write locks. These lock times are
measured in microseconds. They follow this pattern (an operation either prints
read `r` or write `w` lock times, but not both).

```
locks(micros) r:106
```

In this case, the read lock was held for 106 microseconds.

The regex capture groups are `r` and `w`.


### Events

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

## Full list of names to extract

- `timestamp`
- `timestamp_format`
- `thread`
- `conn`
- `operation`
- `namespace`
- `database`
- `collection`
- `duration`
- `query`
- `query_shape`
- `sort_shape`
- `nscanned`
- `ntoreturn`
- `ntoskip`
- `nupdated`
- `nreturned`
- `ninserted`
- `ndeleted`
- `nmoved`
- `numYields`
- `r`
- `w`
- `event`


