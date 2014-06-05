var regret = require('regret');

regret.add(
  'date',
  /\w{3} \w{3} \d{1,2} \d{1,2}:\d{2}:\d{2}/,
  'Wed Mar 12 14:42:31'
);

regret.add(
  'date.iso',
  /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{1,3}-\d{4}/,
  '2014-02-13T18:00:04.709-0500'
);

regret.add(
  'mongodb.log', 
  /({{date.iso}}|{{date}}) \[(\w+)\] (.*)/,
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