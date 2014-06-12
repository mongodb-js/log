var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  // query operation
  it('should match parse the query operation', function() {
    var lines = [
      '2014-06-02T14:26:48.300-0400 [initandlisten] query admin.system.roles ' +
        'planSummary: EOF ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 ' + 
        'keyUpdates:0 numYields:0 locks(micros) W:2347 r:243 nreturned:0 ' +
        'reslen:20 0ms',
      '2014-06-02T14:27:48.300-0400 [TTLMonitor] query admin.system.indexes ' +
        'query: { expireAfterSeconds: { $exists: true } } planSummary: EOF ' +
        'ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 keyUpdates:0 ' + 
        'numYields:0 locks(micros) r:568 nreturned:0 reslen:20 0ms'
    ],
    expected = [
      {
        collection: 'system.roles',
        database: 'admin',
        duration: 0,
        namespace: 'admin.system.roles',
        operation: 'query'
      },
      {
        collection: 'system.indexes',
        database: 'admin',
        duration: 0,
        namespace: 'admin.system.indexes',
        operation: 'query',
        query: '{ expireAfterSeconds: { $exists: true } }'
      }
    ];
    res = log.parse(lines);

    for (var i = 0; i < lines.length; i++)
      for (key in expected[i])
        assert.equal(res[i][key], expected[i][key]);
  });

  it('should match the nested query fields', function() {
    var line = '2014-05-31T14:20:56.002-0400 [conn16] query test.coll query: ' +
      '{ query: { foo: "value", bar: { wee: "value 2" } }, orderby: { number: ' + 
      '-1.0 } } planSummary: EOF ntoreturn:0 ntoskip:0 keyUpdates:0 ' +
      'numYields:0 locks(micros) r:106 nreturned:0 reslen:20 12ms',
    expectedQuery = '{ foo: "value", bar: { wee: "value 2" } }',
    expectedQueryShape = '{ foo: 1, bar: { wee: 1 } }',
    expectedSortShape = '{ number: -1.0 }',
    res = log.parse(line);

    assert.equal(res[0].query, expectedQuery);
    assert.equal(res[0].query_shape, expectedQueryShape);
    assert.equal(res[0].sort_shape, expectedSortShape);
  });

  // it('should match but not parse the query expression edge case', function() {
  //   var line = '2014-05-31T14:20:56.002-0400 [conn16] query test.coll query: ' +
  //     '{ query: { query: "value", orderby: "another value" }, orderby: { ' +
  //     'number: -1.0 } } planSummary: EOF ntoreturn:0 ntoskip:0 keyUpdates:0 ' +
  //     'numYields:0 locks(micros) r:106 nreturned:0 reslen:20 12ms',
  //   expectedQuery = '{ query: "value", orderby: "another value" },',
  //   expectQueryShape = '{ foo: 1, bar: 1 }',
  //   expectedSortShape = '{ number: -1.0 }',
  //   res = log.parse(line);

  //   assert.equal(res[0].query, expectedQuery);
  //   assert.equal(res[0].query_shape, expectQueryShape);
  //   assert.equal(res[0].sort_shape, expectedSortShape);
  // });
});