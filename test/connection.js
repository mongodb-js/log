var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  it('should match the connection', function() {
    var line = '2014-06-02T14:29:05.850-0400 [conn700] allocating new ' +
      'datafile /data/db/test.ns, filling with zeroes...',
    res = log.parse(line)[0];

    assert.equal(res.conn, 'conn700');
  });

  it('should match the connection when it\'s accepted', function() {
    var line = '2014-06-02T14:28:53.408-0400 [initandlisten] connection accep' +
      'ted from 127.0.0.1:52049 #700 (1 connection now open)',
    res = log.parse(line)[0];

    assert.equal(res.conn, 'conn700');
  });
});