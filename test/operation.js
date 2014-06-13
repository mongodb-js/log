var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  // query operation
  it('should match parse the query operation fields', function() {
    var lines = [
      '2014-06-02T14:26:48.300-0400 [initandlisten] query admin.system.roles ' +
        'planSummary: EOF ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 ' + 
        'keyUpdates:0 numYields:0 locks(micros) W:2347 r:243 nreturned:30000 ' +
        'reslen:20 nmoved:11 900000ms',
      '2014-06-02T14:27:48.300-0400 [TTLMonitor] query admin.system.indexes ' +
        'query: { expireAfterSeconds: { $exists: true } } planSummary: EOF ' +
        'ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 keyUpdates:9001 ' + 
        'numYields:0 locks(micros) r:568 nreturned:0 reslen:20 nmoved:11 0ms'
    ],
    expected = [
      {
        collection: 'system.roles',
        database: 'admin',
        duration: 900000,
        keyUpdates: 0,
        namespace: 'admin.system.roles',
        nmoved: 11,
        nreturned: 30000,
        nscanned: 0,
        nscannedObjects: 0,
        ntoskip: 0,
        ntoreturn: 0,
        numYields: 0,
        operation: 'query',
        reslen: 20
      },
      {
        collection: 'system.indexes',
        database: 'admin',
        duration: 0,
        keyUpdates: 9001,
        namespace: 'admin.system.indexes',
        nmoved: 11,
        nreturned: 0,
        nscanned: 0,
        nscannedObjects: 0,
        ntoskip: 0,
        ntoreturn: 0,
        numYields: 0,
        operation: 'query',
        reslen: 20
      }
    ];
    res = log.parse(lines);

    for (var i = 0; i < lines.length; i++)
      for (key in expected[i])
        assert.equal(res[i][key], expected[i][key]);
  });
});