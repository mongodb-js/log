# mongodb-log

[![build status](https://secure.travis-ci.org/imlucas/mongodb-log.png)](http://travis-ci.org/imlucas/mongodb-log)

Normalize MongoDB log entries into objects that make sense.

## Example

```javascript
var parse = require('mongodb-log');
var fs = require('fs');
var es = require('event-stream');

fs.createReadStream('/var/log/mongodb/mongod.log')
  .pipe(es.split('\n'))
  .pipe(parse())
  .pipe(fs.createWriteStream('/var/log/mongodb/mongod.json'));
```

## License

MIT
