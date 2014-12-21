var assert = require('assert'),
    log = require('./..');

describe('Operations', function() {
  // comment field
  it('should parse the comment field', function() {
    lines = [
      '2014-08-11T12:00:30.653-0400 [conn18114] query admin.system' +
      '.namespaces query: { $query: {}, $comment: { mongoscope_feature: "get' + 
      ' instance collections" } } planSummary: COLLSCAN ntoreturn:0 ntoskip:0' + 
      ' nscanned:1 nscannedObjects:1 keyUpdates:0 numYields:0 locks(micros) ' + 
      'r:93 nreturned:1 reslen:89 0ms'
    ];
    expectedComments = [
      {"mongoscope_feature":"get instance collections"}
    ];
    res = log.parse(lines);

    for (var i = 0; i < lines.length; i++)
      assert.deepEqual(res[i].comment, expectedComments[i]);
  }),

  // namespace fields
  it('should parse the namespace field and it\'s related fields', function() {
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
      '{}',
      '{ x: 20.0 }',
      '{ field1: 1 }',
      '{ field1: [ 1 ] }',
      '{ query: {}, orderby: { age: -1.0 } }',
      '{ field1: { field2: { field3: \'val3\' }, field4: \'val4\' }, ' +
      'field5: \'val5\' }',
      '{ field1: { field2: { query: \'val3\' }, field4: \'val4\' }, ' +
      'field5: \'val5\' }',
      '{ field1: { query: { query: \'val3\' }, query: \'val4\' }, ' +
      'query: { query: { query: \'val3\' }, field4: \'val4\' } }',
      '{ field1: /regex/ }',
      '{ field1: /regex/, field2: { query: /regex/ } }',
      '{ field: /wefwef " query: acme.*corp/i }',
      '{ field1: / { query: } /, query: { query: \' / val3 / aaa\' }, x: 1 }',
      '{ field1: \'blah \" query: \" query: blah\' }',
      '{ field1: [ \'a query: a\' ] }',
      '{ _types: "User", emails.email: "user@email.com" }',
      '{ $query: {}, $comment: { mongoscope_feature: "get instance collection' + 
      's" } }'
    ],
    expectedQueries = [
      {},
      { x: 20.0 },
      { field1: 1 },
      { field1: [ 1 ] },
      {},
      { field1: { field2: { field3: 'val3' }, field4: 'val4' }, 
        field5: 'val5' },
      { field1: { field2: { query: 'val3' }, field4: 'val4' },
        field5: 'val5' },
      { "query": { "query": "val3" }, "field4": "val4" },
      { field1: /regex/ },
      { field1: /regex/, field2: { query: /regex/ } },
      { field: /wefwef " query: acme.*corp/i },
      { "query": " / val3 / aaa" },
      { field1: 'blah " query: " query: blah' },
      { field1: [ 'a query: a' ] },
      { _types: "User", "emails.email": "user@email.com" },
      {}
    ];

    var line, res;

    for (var i = 0; i < queries.length; i++) {
      line = 'Thu Jun 12 14:41:43.926 [TTLMonitor] query ' +
      'admin.system.indexes query: ' + queries[i] + ' planSummary: EOF ' +
      'ntoreturn:9 ntoskip:9 nscanned:99 nscannedObjects:0 keyUpdates:9001 ' +
      'numYields:9999 locks(micros) w:1111 R:568 nreturned:0 reslen:20 ' +
      'nmoved:11 ndeleted:100 nupdated:1000 0ms';
      res = log.parse(line)[0];

      assert.deepEqual(res.query, expectedQueries[i]);
    }
  });

  // query pattern field
  it('should parse the query pattern', function() {
    expectedQueryPattern = 'admin.system.indexes { \"x\": 1 }';

    line = 'Thu Jun 12 14:41:43.926 [TTLMonitor] query ' +
    'admin.system.indexes query: { x: 20.0 } planSummary: EOF ' +
    'ntoreturn:9 ntoskip:9 nscanned:99 nscannedObjects:0 keyUpdates:9001 ' +
    'numYields:9999 locks(micros) w:1111 R:568 nreturned:0 reslen:20 ' +
    'nmoved:11 ndeleted:100 nupdated:1000 0ms';

    res = log.parse(line)[0];
    assert.equal(res.queryPattern, expectedQueryPattern);
  });

  // query shape field
  it('should parse the query shape', function() {
    var queries = [
      '{ x: 20.0 }',
      '{ field: { $exists: true } }',
      '{ f11: true, f22: 55, f33: \'str\', $f44: / regex $gt / }',
      '{ f1: [ 3, 2, 1 ] }',
      '{ orderby: { x123: 1.0 }, field1: / { orderby: } /, query: { query: \'' +
      ' / val3 / aaa\' } }',
      '{ expireAfterSeconds: { $exists: 1 } }'
    ],
    expectedQueryShapes = [
      { "x": 1 },
      { "field": 1 },
      { "f11": 1, "f22": 1, "f33": 1, "$f44": 1 },
      { "f1": [ 1, 2, 3 ] },
      { "query": 1 },
      { "expireAfterSeconds": 1 }
    ];

    var line, res;

    for (var i = 0; i < queries.length; i++) {
      line = 'Thu Jun 12 14:41:43.926 [TTLMonitor] query ' +
      'admin.system.indexes query: ' + queries[i] + ' planSummary: EOF ' +
      'ntoreturn:9 ntoskip:9 nscanned:99 nscannedObjects:0 keyUpdates:9001 ' +
      'numYields:9999 locks(micros) w:1111 R:568 nreturned:0 reslen:20 ' +
      'nmoved:11 ndeleted:100 nupdated:1000 0ms';
      res = log.parse(line)[0];

      assert.deepEqual(res.queryShape, expectedQueryShapes[i]);
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
      { "x123": 1 },
      { "x123": -1 },
      { "x123": -1 }
    ]

    var line, res;
    for (var i = 0; i < queries.length; i++) {
      line = '2014-07-01T21:36:48.207-0400 [conn596] query ' +
      'test.testData query: ' + queries[i] + ' planSummary: EOF ' +
      'ntoreturn:9 ntoskip:9 nscanned:99 nscannedObjects:0 keyUpdates:9001 ' +
      'numYields:9999 locks(micros) w:1111 R:568 nreturned:0 reslen:20 ' +
      'nmoved:11 ndeleted:100 nupdated:1000 0ms';
      res = log.parse(line)[0];

      assert.deepEqual(res.sortShape, expectedSortShapes[i]);
    }
  });
});
