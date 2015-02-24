var assert = require('assert'),
  parse = require('./..'),
  fs = require('fs'),
  es = require('event-stream');

var fixture = function(name, fn) {
  var records = [];
  fs.createReadStream(__dirname + '/fixtures/' + name + '.log')
    .pipe(es.split('\n'))
    .pipe(parse())
    .on('data', function(d) {
      records.push(d);
    })
    .on('error', fn)
    .on('end', function() {
      fn(null, records);
    });
};

describe('integration', function() {
  it('should parse collscans.log', function(done) {
    fixture('collscans', function(err, data) {
      if (err) return done(err);
      assert.equal(parse.unknown.length, 0);
      assert.equal(data.length, 1081);
      done();
    });
  });
  it('should parse mask_centers.log', function(done) {
    fixture('mask_centers', function(err, data) {
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
    fixture('mongos', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });

  it('should parse year_rollover', function(done) {
    fixture('year_rollover', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });


  it('should parse 2.2.5', function(done) {
    fixture('mongod_225', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });

  it('should parse 2.4.11', function(done) {
    fixture('mongod_2411', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });


  it('should parse 2.6', function(done) {
    fixture('mongod_26', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });

  it('should parse 2.6 corrupt', function(done) {
    fixture('mongod_26_corrupt', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 2);
      done();
    });
  });

  // @see https://github.com/imlucas/mongodb-log/issues/36
  it('should parse 2.7', function(done) {
    fixture('mongod_278', function(err, data) {
      if (err) return done(err);
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });

  it('should parse 2.7 partial', function(done) {
    fixture('mongod_278_partial', function(err, data) {
      if (err) return done(err);
      // console.log('data', JSON.stringify(data, null, 2));
      assert(data.length > 0);
      assert.equal(parse.unknown.length, 0);
      done();
    });
  });

});
