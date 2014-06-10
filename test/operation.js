// TODO
// use mtools to convert logs to json and compare your output with it

describe('parse', function() {
  it('should match the query operation', function() {
    lines = [
      '2014-06-02T14:26:48.300-0400 [initandlisten] query admin.system.roles ' +
        'planSummary: EOF ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 ' + 
        'keyUpdates:0 numYields:0 locks(micros) W:2347 r:243 nreturned:0 ' +
        'reslen:20 0ms',
      '2014-06-02T14:27:48.300-0400 [TTLMonitor] query admin.system.indexes ' +
        'query: { expireAfterSeconds: { $exists: true } } planSummary: EOF ' + '
        ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 keyUpdates:0 ' + 
        'numYields:0 locks(micros) r:568 nreturned:0 reslen:20 0ms'
    ];
    expected = [
      {
        collection:
        database: 
        duration: '0ms',
        namespace:
        operation: 'query'
      },
      {
        collection:
        database: 
        duration: '0ms',
        namespace:
        operation: 'query'
      }
    ];
    res = log.parse(lines);


  });

  it('should match the connection when it\'s accepted', function() {
    var line = '2014-06-02T14:28:53.408-0400 [initandlisten] connection accep' +
      'ted from 127.0.0.1:52049 #700 (1 connection now open)',
    res = log.parse(line)[0];

    assert.equal(res.conn, 'conn700');
  });
});