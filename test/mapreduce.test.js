var assert = require('assert');
var parseFixture = require('./helpers').parseFixture;

describe.skip('mapreduce', function() {
  it('should work', function(done) {
    parseFixture('mapreduce', function(err, lines) {
      if (err) return done(err);
      console.log('lines', JSON.stringify(lines, null, 2));

      var res = lines[0];
      assert.equal(res.operation, 'mapreduce');
      done();
    });
  });
});
