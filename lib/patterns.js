/*eslint max-len:0*/
var regret = require('regret');

/**
 * ## Parts
 */
regret.add(
  'IPAddress',
  /(?:\d{1,3}\.){3}\d{1,3}/,
  '127.000.000.122'
);

regret.add(
  'connection.accept',
  /^connection accepted from {{IPAddress}}:\d{1,5} #(\d*)/,
  'connection accepted from 127.0.0.1:52049 #700 (1 connection now open)',
  ['_id']
);

regret.add(
  'ctime', // covers ctime and ctime-pre2.4
  /\w{3} \w{3} (?: \d|\d{2}) \d{2}:\d{2}:\d{2}(?:|.\d{3})/,
  'Wed Mar  2 14:42:31.000'
);

regret.add(
  'iso8601', // covers iso8601-local and iso8601-utc
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}(?:Z|[+-]\d{4})/,
  '2014-02-13T18:00:04.709-0500'
);

regret.add(
  'component',
  /[-|ACCESS|COMMAND|CONTROL|GEO|INDEX|NETWORK|QUERY|REPL|SHARDING|STORAGE|JOURNAL|WRITE|S2]/,
  'SHARDING'
);

regret.add(
  'level',
  /[FEWIDU]{1}/,
  'D'
);

regret.add(
  'namespace',
  /(([^\\\\\/\'".*<>:|? ]+)\.([^\0\$]+))/,
  'local.oplog.rs',
  ['namespace', 'database', 'collection']
);

regret.add(
  'namespaced_command',
  /(([^\\\\\/\'".*<>:|? ]+))\.\$cmd/,
  'local.oplog.rs',
  ['namespace', 'database']
);

regret.add('flushing_mmaps',
  /flushing mmaps took (\d+)ms for (\d+) files/,
  'flushing mmaps took 100ms for 10 files',
  ['duration']
);

regret.add(
  'chunkmanager_load',
  /ChunkManager: time to load chunks for {{namespace}}: (\d+)ms sequenceNumber: (\d+) version: (\d+)( based on: (\d+))?/,
  'ChunkManager: time to load chunks for pb3.hourly_stats: 3156ms sequenceNumber: 133 version: 38916',
  ['namespace', 'database', 'collection', 'duration', 'sequence_number', 'version', 'base_version']
);

/**
 * ## Log lines
 */
regret.add(
  'mongodb.log_26',
  /(^({{ctime}}|{{iso8601}}) \[(\w+)\] (.*))/,
  '2014-02-13T18:00:04.709-0500 [initandlisten] db version v2.5.6-pre-',
  ['line', 'timestamp', 'thread', 'message']
);

regret.add(
  'mongodb.log_3',
  /(^({{iso8601}}) ({{level}}) ({{component}}+)(?:\s*)\[(\w+)\] (.*))/,
  '2014-10-31T13:00:03.996+0000 W STORAGE  [FileAllocator] creating directory /Users/joleary/Documents/Support/CS-16129/data/db/_tmp',
  ['line', 'timestamp', 'level', 'component', 'thread', 'message']
);

regret.add(
  'mongodb.logshutdownexception',
  /(^({{ctime}}|{{iso8601}}) (.*))/,
  'Thu Mar  6 13:09:01.671 shutdown failed with exception',
  ['line', 'timestamp', 'message']
);

regret.add(
  'mongodb.logshutdown',
  /(dbexit+)\: (.*)/,
  'dbexit: really exiting now',
  ['name', 'message']
);


// console.log('regret matchers', regret.matchers);
module.exports = regret;
