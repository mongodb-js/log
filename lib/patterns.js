var regret = require('regret');

regret.add(
  'IPAddress',
  /(?:\d{1,3}\.){3}\d{1,3}/,
  '127.000.000.122'
);

regret.add(
  'connectionAccepted',
  /^connection accepted from {{IPAddress}}:\d{1,5} #(\d*)/,
  'connection accepted from 127.0.0.1:52049 #700 (1 connection now open)',
  ['connNum']
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

// @todo: tricky use of line as parent group....
regret.add(
  'mongodb.log',
  /(^({{ctime}}|{{iso8601}}) \[(\w+)\] (.*))/,
  '2014-02-13T18:00:04.709-0500 [initandlisten] db version v2.5.6-pre-',
  ['line', 'timestamp', 'thread', 'message']
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
  'mongodb.loglatest',
  /(^{{iso8601}}) ({{level}}) ({{component}}+)(?:\s*)\[(\w+)\] (.*)/,
  '2014-10-31T13:00:03.996+0000 W STORAGE  [FileAllocator] creating directory /Users/joleary/Documents/Support/CS-16129/data/db/_tmp',
  ['timestamp', 'level', 'component', 'thread', 'message']
);

regret.add(
  'mongodb.logshutdownexception',
  /^({{ctime}}|{{iso8601}}) (.*)/,
  'Thu Mar  6 13:09:01.671 shutdown failed with exception',
  ['timestamp', 'message']
);

regret.add(
  'mongodb.logshutdown',
  /(dbexit+)\: (.*)/,
  'dbexit: really exiting now',
  ['name', 'message']
);


// console.log('regret matchers', regret.matchers);
module.exports = regret;
