var assert = require('assert');
var parse = require('./..');

describe.skip('Connection', function() {
  it('should find the id', function() {
    var line = '2014-06-02T14:29:05.850-0400 [conn700] allocating new '
      + 'datafile /data/db/test.ns, filling with zeroes...';
    var res = parse(line)[0];

    assert.equal(res.connection_id, 'conn700');
  });

  it('should find the id when it\'s accepted', function() {
    var line = '2014-06-02T14:28:53.408-0400 [initandlisten] connection accep'
      + 'ted from 127.0.0.1:52049 #700 (1 connection now open)';
    var res = parse(line)[0];

    assert.equal(res.connection_id, 'conn700');
  });
});
