var log = require('./'),
  assert = require('assert');

describe('parse', function(){
  it('should match', function(){
    var line = '2014-02-13T18:00:04.709-0500 [initandlisten] db version v2.5.6-pre-';
    var res = log.parse(line)[0];
    assert.equal(res.name, 'initandlisten');
  });
  it('should match the old format', function(){
    var expected = {
      name: 'initandlisten',
      message: 'db version v2.5.6-pre-',
      date: 'Wed Mar 12 14:42:31',
      event: null
    },
    line = 'Wed Mar 12 14:42:31 [initandlisten] db version v2.5.6-pre-',
    res = log.parse(line)[0];
    assert.equal(res.name, 'initandlisten');
    assert.deepEqual(expected, res);
  });

  it('should not puke on nulls', function(){
    log.parse(null);
  });

  it('should accept multiple lines', function(){
    var expected = [
      { name: 'conn611',
      message: 'end connection 127.0.0.1:57499 (22 connections now open)',
      date: '2014-05-16T10:39:00.938-0400',
      event: null },
    { name: 'clientcursormon',
      message: 'mem (MB) res:9 virt:3514',
      date: '2014-05-16T10:43:24.840-0400',
      event: null },
    { name: 'clientcursormon',
      message: ' mapped (incl journal view):960',
      date: '2014-05-16T10:43:24.840-0400',
      event: null },
    { name: 'clientcursormon',
      message: ' connections:22',
      date: '2014-05-16T10:43:24.840-0400',
      event: null },
    { name: 'clientcursormon',
      message: 'mem (MB) res:9 virt:3514',
      date: '2014-05-16T10:48:24.926-0400',
      event: null },
    { name: 'clientcursormon',
      message: ' mapped (incl journal view):960',
      date: '2014-05-16T10:48:24.926-0400',
      event: null },
    { name: 'clientcursormon',
      message: ' connections:22',
      date: '2014-05-16T10:48:24.926-0400',
      event: null }
    ],
    lines = [
      '2014-05-16T10:39:00.938-0400 [conn611] end connection 127.0.0.1:57499 (22 connections now open)',
      '2014-05-16T10:43:24.840-0400 [clientcursormon] mem (MB) res:9 virt:3514',
      '2014-05-16T10:43:24.840-0400 [clientcursormon]  mapped (incl journal view):960',
      '2014-05-16T10:43:24.840-0400 [clientcursormon]  connections:22',
      '2014-05-16T10:48:24.926-0400 [clientcursormon] mem (MB) res:9 virt:3514',
      '2014-05-16T10:48:24.926-0400 [clientcursormon]  mapped (incl journal view):960',
      '2014-05-16T10:48:24.926-0400 [clientcursormon]  connections:22'
    ], res = log.parse(lines);

    assert.deepEqual(expected, res);
  });

  it('should grok the ready event', function(){
    var expected = [
      { name: 'initandlisten',
        message: 'recover : no journal files present, no recovery needed',
        date: '2014-05-16T10:50:13.450-0400',
        event: null
      },
      {
        name: 'initandlisten',
        message: 'waiting for connections on port 27017',
        date: '2014-05-16T10:50:13.579-0400',
        event: { name: 'ready', data: { port: 27017 } }
      }
    ],
    lines = [
      '2014-05-16T10:50:13.450-0400 [initandlisten] recover : no journal files present, no recovery needed',
      '2014-05-16T10:50:13.579-0400 [initandlisten] waiting for connections on port 27017'
    ], res = log.parse(lines);
    assert.deepEqual(expected, res);
  });


  // Wed Jan  1 12:45:05.102 [conn3] build index twitter.tweets { lang: 1.0, protected: 1.0 }
  // Wed Jan  1 12:45:05.363 [conn3] build index done.  scanned 51428 total records. 0.26 secs
  // ProgressMeterHolder pm(op->setMessage("index: (1/3) external sort", "Index: External Sort Progress", d->stats.nrecords, 10));
  // ProgressMeter& pm = op->setMessage("Index Bulk Build: (2/3) btree bottom up",
  // op->setMessage("Index Bulk Build: (3/3) btree-middle",
  //                "Index: (3/3) BTree Middle Progress");
  it('should pick up index build events');

  // cluster Lucass-MacBook-Pro.local:29000 pinged successfully at Mon May  5 19:11:41 2014 by distributed lock pinger 'Lucass-MacBook-Pro.local:29000/Lucass-MacBook-Pro.local:30999:1398730544:16807', sleeping for 30000ms
  it('should pick up lock pinger events');

  //   distributed lock 'balancer/Lucass-MacBook-Pro.local:30999:1398730544:16807' acquired, ts : 53681aeb1a6d32f6a2cefc7f
  // [Balancer]7:12:43.719
  // distributed lock 'balancer/Lucass-MacBook-Pro.local:30999:1398730544:16807' unlocked.
  it('should pick up balancer lock events');

  // Fri Mar 21 14:44:13.125 [initandlisten] connection accepted from
  // xxx.xxx.xxx.xxx:42853 #235 (232 connections now open)
  // Fri Mar 21 14:44:13.292 [rsBackgroundSync] replSet syncing to:
  // db1-test:27017
  // Fri Mar 21 14:44:13.295 [rsSync] replSet still syncing, not yet to
  // minValid optime 532c4d9e:3
  // Fri Mar 21 14:44:13.348 [repl writer worker 1] info: indexing in
  // foreground on this replica; was a background index build on the primary
  // Fri Mar 21 14:44:13.348 [repl writer worker 1] build index
  // di.vL { vId.s: 1, vId.t: 1 }
  it('should pick up replicaset sync events');

  // m/r: merge post processing
  // m/r: reduce post processing
  // m/r: (3/3) final reduce to collection
  // m/r: (1/3) emit phase
  it('should pick up map reduce progress');

  // https://github.com/mongodb/mongo/blob/c7625872ea64c1846c6799966a700d57c6e2ad6e/src/mongo/util/progress_meter.cpp
  // buf << _name << ": " << _done << '/' << _total << ' ' << (_done*100)/_total << '%';
  // if ( ! _units.empty() ) {
  //     buf << "\t(" << _units << ")" << endl;
  // }
  it('should pick up progress meter events');
});
