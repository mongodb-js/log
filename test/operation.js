var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  it('should parse the query operation type and stat fields', function() {
    var lines = [
      '2014-06-02T14:26:48.300-0400 [initandlisten] query admin.system.$index' +
        ' planSummary: EOF ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0' + 
        ' keyUpdates:0 numYields:0 locks(micros) W:2347 r:243 nreturned:30000' +
        ' reslen:20 nmoved:11 900000ms',
      '2014-06-02T14:27:48.300-0400 [TTLMonitor] query admin.system.collection ' +
        'query: { expireAfterSeconds: { $exists: true } } planSummary: EOF ' +
        'ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 keyUpdates:9001 ' + 
        'numYields:0 locks(micros) r:568 nreturned:0 reslen:20 nmoved:11 0ms'
    ],
    expected = [
      {
        duration: 900000,
        keyUpdates: 0,
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
        duration: 0,
        keyUpdates: 9001,
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

  it('should parse the namespace field and it\'s related fields', 
    function() {
      var namespaceFields = {
        'admin.$index': {
          'collection': '$index',
          'database': 'admin',
          'index': 'index'
        },
        'admin.system': {
          'collection': 'system',
          'database': 'admin'
        },
        'admin.system.$index': {
          'collection': 'system.$index',
          'database': 'admin',
          'index': 'index'
        },
        'admin.system1.system2.system3': {
          'collection': 'system1.system2.system3',
          'database': 'admin'
        },
        'admin.system1.system2.system3.$index': {
          'collection': 'system1.system2.system3.$index',
          'database': 'admin',
          'index': 'index'
        }
      };

      var line, res;

      for (var namespace in namespaceFields) {
        line = '2014-06-02T14:26:48.300-0400 [initandlisten] query ' + 
          namespace + ' planSummary: EOF ntoreturn:0 ntoskip:0 ' + 
          'nscanned:0 nscannedObjects:0 keyUpdates:0 numYields:0 ' + 
          'locks(micros) W:2347 r:243 nreturned:30000 reslen:20 nmoved:11 ' + 
          '900000ms';

        res = log.parse(line);
        assert.equal(res[0].namespace, namespace);

        for (var expectedField in namespaceFields[namespace]) {
          assert.equal(res[0][expectedField], 
            namespaceFields[namespace][expectedField]);
        }
      }
    }
  );

});