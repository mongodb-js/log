var parse = require('./..'),
  assert = require('assert');

describe('parse', function() {
  it('should match the old format', function() {
    var expected = {
        thread: 'initandlisten',
        message: 'db version v2.5.6-pre-',
        timestamp: 'Wed Mar 12 14:42:31',
        event: null
      },
      line = 'Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-',
      res = parse(line)[0];

    assert.equal(res.event, expected.event);
    assert.equal(res.timestamp, expected.timestamp);
    assert.equal(res.message, expected.message);
    assert.equal(res.name, expected.name);
  });

  it('should handle fatal errors', function() {
    var line = 'Wed Mar 12 14:42:31 [initandlisten] exception in ' +
    'initAndListen: 10309 Unable to create/open lock file: ' +
    '/data/mongod.lock errno:13 Permission denied Is a mongod instance ' +
    'already running?, terminating';
    var res = parse(line)[0];
    assert.equal(res.event.name, 'error');
  });

  it('should not puke on nulls', function() {
    parse(null);
  });

  it('should accept multiple lines', function() {
    var expected = [
        {
          name: 'conn611',
          message: 'end connection 127.0.0.1:57499 (22 connections now open)',
          timestamp: '2014-05-16T10:39:00.938-0400',
          event: null
        },
        {
          name: 'clientcursormon',
          message: 'mem (MB) res:9 virt:3514',
          timestamp: '2014-05-16T10:43:24.840-0400',
          event: null
        },
        {
          name: 'clientcursormon',
          message: ' mapped (incl journal view):960',
          timestamp: '2014-05-16T10:43:24.840-0400',
          event: null
        },
        {
          name: 'clientcursormon',
          message: ' connections:22',
          timestamp: '2014-05-16T10:43:24.840-0400',
          event: null
        },
        {
          name: 'clientcursormon',
          message: 'mem (MB) res:9 virt:3514',
          timestamp: '2014-05-16T10:48:24.926-0400',
          event: null
        },
        {
          name: 'clientcursormon',
          message: ' mapped (incl journal view):960',
          timestamp: '2014-05-16T10:48:24.926-0400',
          event: null
        },
        {
          name: 'clientcursormon',
          message: ' connections:22',
          timestamp: '2014-05-16T10:48:24.926-0400',
          event: null
        }
      ],
      lines = [
        '2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 ' +
        '(22 connections now open)',
        '2014-05-16T10:43:24.840-0400 [clientcursormon] mem (MB) res:9 virt:3514',
        '2014-05-16T10:43:24.840-0400 [clientcursormon]  mapped (incl journal ' +
        'view):960',
        '2014-05-16T10:43:24.840-0400 [clientcursormon]  connections:22',
        '2014-05-16T10:48:24.926-0400 [clientcursormon] mem (MB) res:9 virt:3514',
        '2014-05-16T10:48:24.926-0400 [clientcursormon]  mapped (incl journal ' +
        'view):960',
        '2014-05-16T10:48:24.926-0400 [clientcursormon]  connections:22'
      ],
      res = parse(lines);

    for (var i = 0; i < expected.length; i++) {
      assert.equal(res.event, expected.event);
      assert.equal(res.timestamp, expected.timestamp);
      assert.equal(res.message, expected.message);
      assert.equal(res.name, expected.name);
    }
  });

  it('should find query shape in findAndModify' +
  ' and handle trailing commas', function() {
      var line = '2014-06-21T00:11:35.468+0000 [conn524] command mmsdbjobs.$cmd' +
      ' command: findAndModify { findandmodify: "data.jobsProcessor",' +
      ' query: { $and: [ { scheduledFor: { $lte: 1403309490388 } }, {' +
      ' status: "NEW" } ] }, sort: { priority: 1, updated: -1 }, update:' +
      ' { $set: { updated: 1403309490388, status: "PRE_OWNED" } }, new:' +
      ' true } keyUpdates:0 numYields:0 locks(micros) w:11693 reslen:44 11ms';
      var res = parse(line)[0];
    });

  it('should grok the ready event', function() {
    var expected = [
        {
          thread: 'initandlisten',
          message: 'recover : no journal files present, no recovery needed',
          timestamp: '2014-05-16T10:50:13.450-0400',
          event: null
        },
        {
          thread: 'initandlisten',
          message: 'waiting for connections on port 27017',
          timestamp: '2014-05-16T10:50:13.579-0400',
          event: {
            name: 'ready',
            data: {
              port: 27017
            }
          }
        }
      ],
      lines = [
        '2014-05-16T10:50:13.450-0400 [initandlisten] recover : no journal ' +
        'files present, no recovery needed',
        '2014-05-16T10:50:13.579-0400 [initandlisten] waiting for connections ' +
        'on port 27017'
      ],
      res = parse(lines);

    for (var i = 0; i < expected.length; i++) {
      assert.equal(res.event, expected.event);
      assert.equal(res.timestamp, expected.timestamp);
      assert.equal(res.message, expected.message);
      assert.equal(res.name, expected.name);
    }
  });
});
