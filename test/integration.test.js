var assert = require('assert');
var parse = require('./..');
var parseFixture = require('./helpers').parseFixture;

describe('integration', function() {
  it('should parse collscans.log', function(done) {
    parseFixture('collscans', function(err, data) {
      if (err) return done(err);
      assert.equal(data.length, 1081);
      done();
    });
  });
  it.skip('should parse mask_centers.log', function(done) {
    parseFixture('mask_centers', function(err, data) {
      if (err) return done(err);

      assert.equal(data.length, 2);
      assert.equal(parse.unknown.length, 0);
      // @see https://github.com/imlucas/mongodb-log/issues/47
      // assert.equal(data[0].operation, 'command');
      // assert.equal(data[0].command, 'dropDatabase');

      var d = data[0];
      // microseconds -> milliseconds
      assert.equal(d.stats.write_lock_time, 1574.563);

      // timestamp_format
      assert.equal(d.timestamp_format, 'ctime-pre2.4');
      done();
    });
  });

  it('should parse mongos', function(done) {
    parseFixture('mongos', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });

  it.skip('should parse year_rollover', function(done) {
    parseFixture('year_rollover', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });


  it.skip('should parse 2.2.5', function(done) {
    parseFixture('mongod_225', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      done();
    });
  });

  it('should parse 2.4.11', function(done) {
    parseFixture('mongod_2411', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      done();
    });
  });


  it('should parse 2.6', function(done) {
    parseFixture('mongod_26', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      done();
    });
  });

  it('should parse 2.6 corrupt', function(done) {
    parseFixture('mongod_26_corrupt', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      done();
    });
  });

  // @see https://github.com/imlucas/mongodb-log/issues/36
  it('should parse 2.7', function(done) {
    parseFixture('mongod_278', function(err, data) {
      if (err) return done(err);
      assert(data.length > 0);
      done();
    });
  });

  it('should parse 2.7 partial', function(done) {
    parseFixture('mongod_278_partial', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      done();
    });
  });

  it('should handle replset heartbeat commands', function(done) {
    parseFixture('replset-heartbeat', function(err, data) {
      if (err) return done(err);

      done();
    });
  });
});
