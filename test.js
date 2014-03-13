var log = require('./'),
  assert = require('assert');

describe('parse', function(){
  it('should match', function(){
    var line = '2014-02-13T18:00:04.709-0500 [initandlisten] db version v2.5.6-pre-';
    var res = log.parse(line)[0];
    assert.equal(res.name, 'initandlisten');
  });
  it('should match the old format', function(){
    var line = 'Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-';
    var res = log.parse(line)[0];
    assert.equal(res.name, 'initandlisten');
  });
});
