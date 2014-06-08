var regret = require('regret');

regret.add(
  'ctimeCase1',
  /\w{3} \w{3}  \d{1} \d{2}:\d{2}:\d{2}.\d{3}/,
  'Wed Mar  2 14:42:31.000'
);

regret.add(
  'ctimeCase2',
  /\w{3} \w{3} \d{2} \d{2}:\d{2}:\d{2}.\d{3}/,
  'Wed Mar 12 14:42:31.000'
);

regret.add(
  'ctime',
  /{{ctimeCase1}}|{{ctimeCase2}}/
);

regret.add(
  'ctimePreTwoPointFourCase1',
  /^\w{3} \w{3}  \d \d{2}:\d{2}:\d{2}/,
  'Wed Mar  2 14:42:31'
);

regret.add(
  'ctimePreTwoPointFourCase2',
  /^\w{3} \w{3} \d{2} \d{2}:\d{2}:\d{2}/,
  'Wed Mar 12 14:42:31'
);

regret.add(
  'ctimePreTwoPointFour',
  /{{ctimePreTwoPointFourCase1}}|{{ctimePreTwoPointFourCase2}}/
);

regret.add(
  'iso8601_local',
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}[+-]\d{4}/,
  '2014-02-13T18:00:04.709-0500'
);

regret.add(
  'iso8601_utc',
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/,
  '1970-01-01T00:00:00.000Z'
);

regret.add(
  'timestamp',
  new RegExp('({{ctime}}|{{ctimePreTwoPointFour}}|{{iso8601_local}}|' +
    '{{iso8601_utc}})')
);

regret.add(
  'mongodb.log', 
  /^{{timestamp}} \[(\w+)\] (.*)/,
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