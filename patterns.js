var regret = require('regret');

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
  'operation',
  /command|delete|getmore|query|update/,
  '2014-02-13T18:00:04.709-0500'
);

regret.add(
  'mongodb.log', 
  /^({{ctime}}|{{iso8601}}) \[(\w+)\] (.*)/,
  '2014-02-13T18:00:04.709-0500 [initandlisten] db version v2.5.6-pre-',
  ['date', 'name', 'message']
);

regret.add(
  'mongodb.logshutdown', 
  /(\w+)\: (.*)/,
  'dbexit: really exiting now', 
  ['name', 'message']
);

module.exports = regret;