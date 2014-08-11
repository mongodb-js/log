describe('Progress', function() {
  // Wed Jan  1 12:45:05.102 [conn3] build index twitter.tweets  \
  // { lang: 1.0, protected: 1.0 }
  // Wed Jan  1 12:45:05.363 [conn3] build index done.  scanned 51428 total  \
  // records. 0.26 secs
  // ProgressMeterHolder pm(op->setMessage("index: (1/3) external sort",  \
  // "Index: External Sort Progress", d->stats.nrecords, 10));
  // ProgressMeter& pm = op->setMessage("Index Bulk Build: (2/3) btree bottom  \
  // up",
  // op->setMessage("Index Bulk Build: (3/3) btree-middle",
  //                "Index: (3/3) BTree Middle Progress");
  it('should pick up index build events');

  // cluster Lucass-MacBook-Pro.local:29000 pinged successfully at Mon May  5  \
  // 19:11:41 2014 by distributed lock pinger \
  // 'Lucass-MacBook-Pro.local:29000/Lucass-MacBook-Pro.local:30999:1398730544 \
  // :16807', sleeping for 30000ms
  it('should pick up lock pinger events');

  // distributed lock 'balancer/Lucass-MacBook-Pro.local:30999:1398730544: \
  // 16807' acquired, ts : 53681aeb1a6d32f6a2cefc7f
  // [Balancer]7:12:43.719
  // distributed lock 'balancer/Lucass-MacBook-Pro.local:30999:1398730544: \
  // 16807' unlocked.
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

  // https://github.com/mongodb/mongo/blob/c7625872ea64c1846c6799966a700d57c6e \
  // 2ad6e/src/mongo/util/progress_meter.cpp
  // buf << _name << ": " << _done << '/' << _total << ' ' << (_done*100)/ \
  // _total << '%';
  // if ( ! _units.empty() ) {
  //     buf << "\t(" << _units << ")" << endl;
  // }
  it('should pick up progress meter events');
});
