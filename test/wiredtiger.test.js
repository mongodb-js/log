var parseFixture = require('./helpers').parseFixture;

describe('wiredtiger', function() {
  it('should work', function(done) {
    parseFixture('wiredtiger', function(err, lines) {
      if (err) return done(err);
      done();
    });
  });
});
