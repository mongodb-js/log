var assert = require('assert'),
    log    = require('./..');

describe('parse', function() {
  it('should match line', function() {
    var lines = [
      'this line does not fit a pattern',
      '2014-06-02T14:26:30.147-0400 [initandlisten] MongoDB starting' + 
        ' : pid=4671 port=27017 dbpath=/data/db 64-bit ' +
        'host=Waleys-MacBook-Pro.local'
    ],
    res = log.parse(lines);

    for (var i = 0; i < lines.length; i++)
      assert.equal(res[i].line, lines[i]);
  });
});