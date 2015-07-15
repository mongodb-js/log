# mongodb-log [![][npm_img]][npm_url] [![][travis_img]][travis_url] [![][coverage_img]][coverage_url] [![][gitter_img]][gitter_url]

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

Apache 2.0

[travis_img]: https://secure.travis-ci.org/mongodb-js/log.svg?branch=master
[travis_url]: https://travis-ci.org/mongodb-js/log
[npm_img]: https://img.shields.io/npm/v/mongodb-log.svg
[npm_url]: https://www.npmjs.org/package/mongodb-log
[coverage_img]: https://coveralls.io/repos/mongodb-js/log/badge.svg?branch=master
[coverage_url]: https://coveralls.io/r/mongodb-js/log
[gitter_img]: https://badges.gitter.im/Join%20Chat.svg
[gitter_url]: https://gitter.im/mongodb-js/mongodb-js
