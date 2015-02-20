var assert = require('assert'),
  parse = require('./..');

describe('parse', function() {
  it('should split tokens', function() {
    var line = '2014-06-02T14:26:48.300-0400 [initandlisten] query admin.system.roles ' +
    'planSummary: EOF ntoreturn:0 ntoskip:0 nscanned:0 nscannedObjects:0 ' +
    'keyUpdates:0 numYields:0 locks(micros) W:2347 r:243 nreturned:0 ' +
    'reslen:20 0ms';

    var expected = [
      '2014-06-02T14:26:48.300-0400', '[initandlisten]', 'query',
      'admin.system.roles', 'planSummary:', 'EOF', 'ntoreturn:0', 'ntoskip:0',
      'nscanned:0', 'nscannedObjects:0', 'keyUpdates:0', 'numYields:0',
      'locks(micros)', 'W:2347', 'r:243', 'nreturned:0', 'reslen:20', '0ms'
    ];
    var res = parse(line);

    assert.deepEqual(res[0].tokens, expected);
  });
});
