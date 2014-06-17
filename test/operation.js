var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  // namespace fields
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

  // operation type and stats
  it('should parse the query operation type and stats', function() {
    var lines = [
      '2014-06-02T14:26:48.300-0400 [initandlisten] command admin.system ' +
        'planSummary: EOF ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 ' + 
        'keyUpdates:0 numYields:0 locks(micros) W:2347 r:243 nreturned:30000 ' +
        'reslen:20 nmoved:11 ninserted:100 900000ms',
      '2014-06-02T14:27:48.300-0400 [TTLMonitor] query admin.system.indexes ' +
        'query: { expireAfterSeconds: { $exists: true } } planSummary: EOF ' +
        'ntoreturn:9 ntoskip:9 nscanned:99 nscannedObjects:0 keyUpdates:9001 ' + 
        'numYields:9999 locks(micros) w:1111 R:568 nreturned:0 reslen:20 ' + 
        'nmoved:11 ndeleted:100 nupdated:1000 0ms'
    ],
    expected = [
      {
        W: 2347,
        collection: 'system',
        database: 'admin',
        duration: 900000,
        keyUpdates: 0,
        namespace: 'admin.system',
        ninserted: 100,
        nmoved: 11,
        nreturned: 30000,
        nscanned: 0,
        nscannedObjects: 0,
        ntoskip: 0,
        ntoreturn: 0,
        numYields: 0,
        operation: 'command',
        r: 243,
        reslen: 20
      },
      {
        R: 568,
        collection: 'system.indexes',
        database: 'admin',
        duration: 0,
        keyUpdates: 9001,
        namespace: 'admin.system.indexes',
        ndeleted: 100,
        nmoved: 11,
        nreturned: 0,
        nscanned: 99,
        nscannedObjects: 0,
        ntoskip: 9,
        ntoreturn: 9,
        nupdated: 1000,
        numYields: 9999,
        operation: 'query',
        reslen: 20,
        w: 1111
      }
    ];
    res = log.parse(lines);

    for (var i = 0; i < lines.length; i++)
      for (key in expected[i])
        assert.equal(res[i][key], expected[i][key]);
  });

  // query field
  it('should parse the query field or nested query field', function() {
    var queries = [
      '{ field1: { field2: { field3: \'val3\' }, field4: \'val4\' }, ' +
        'field5: \'val5\' }',
      '{ field1: { field2: { query: \'val3\' }, field4: \'val4\' }, ' +
        'field5: \'val5\' }',
      '{ field1: { query: { query: \'val3\' }, query: \'val4\' }, ' +
        'query: { query: { query: \'val3\' }, field4: \'val4\' } }',
      '{ field1: /regex/ }',
      '{ field1: /regex { query: regex/ }',
      '{ field: /wefwef " query: acme.*corp/i }',
      '{ field1: / { query: } /, query: { query: \' / val3 / aaa\' }, x: 1 }',
      '{ field1: \'blah \" query: \" query: blah\' }'
    ],
    expectedQueries = [
      '{ field1: { field2: { field3: \'val3\' }, field4: \'val4\' }, ' +
        'field5: \'val5\' }',
      '{ field1: { field2: { query: \'val3\' }, field4: \'val4\' }, ' +
        'field5: \'val5\' }',
      '{ query: { query: \'val3\' }, field4: \'val4\' }',
      '{ field1: /regex/ }',
      '{ field1: /regex { query: regex/ }',
      '{ field: /wefwef " query: acme.*corp/i }',
      '{ query: \' / val3 / aaa\' }',
      '{ field1: \'blah \" query: \" query: blah\' }'
    ];

    var line, res;

    for (var i = 0; i < queries.length; i++) {
      line = '2014-06-02T14:27:48.300-0400 [TTLMonitor] query ' + 
        'admin.system.indexes query: ' + queries[i] + ' planSummary: EOF ' + 
        'ntoreturn:9 ntoskip:9 nscanned:99 nscannedObjects:0 keyUpdates:9001 ' + 
        'numYields:9999 locks(micros) w:1111 R:568 nreturned:0 reslen:20 ' + 
        'nmoved:11 ndeleted:100 nupdated:1000 0ms';
      res = log.parse(line)[0];

      assert.equal(res.query, expectedQueries[i]);
    }
  });

  // sort shape field
  it('should parse the sort shape field', function() {
    var queries = [
      '{ orderby: { x123: 1.0 }, field1: / { orderby: } /, query: { query: \'' + 
        ' / val3 / aaa\' } }',
      '{ field1: / { orderby: } /, query: { orderby: \' / val3 / aaa\' }, ' +
        'orderby: { x123: -1.0 } }',
      '{ field1: / { orderby: } /, query: { orderby: \' / orderby / aaa\' }, ' +
        'test: \'wee\', orderby: { x123: -1.0 } }'
    ],
    expectedSortShapes = [
      '{ x123: 1.0 }',
      '{ x123: -1.0 }',
      '{ x123: -1.0 }'
    ]

    var line, res;

    for (var i = 0; i < queries.length; i++) {
      line = '2014-06-02T14:27:48.300-0400 [TTLMonitor] query ' + 
        'admin.system.indexes query: ' + queries[i] + ' planSummary: EOF ' + 
        'ntoreturn:9 ntoskip:9 nscanned:99 nscannedObjects:0 keyUpdates:9001 ' + 
        'numYields:9999 locks(micros) w:1111 R:568 nreturned:0 reslen:20 ' + 
        'nmoved:11 ndeleted:100 nupdated:1000 0ms';
      res = log.parse(line)[0];

      assert.equal(res.sort_shape, expectedSortShapes[i]);
    }
  });
});