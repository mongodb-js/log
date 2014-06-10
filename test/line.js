var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  it('should match line', function() {
    var line = '2014-06-02T14:26:30.147-0400 [initandlisten] MongoDB starting' + 
      ' : pid=4671 port=27017 dbpath=/data/db 64-bit host=Waleys-MacBook-Pro' +
      '.local'
    res = log.parse(line)[0];

    assert.equal(res.line, line);
  });
});