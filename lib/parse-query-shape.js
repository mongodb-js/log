var _ = require('underscore');
var debug = require('debug')('mongodb-log:parse-query-shape');

var QUERY_OPS = '$exists $gt $gte $in $lt $lte $nin $regex'.split(' ');

function parseQueryShapeObject(obj) {
  var shape = {};
  _.each(_.clone(obj), function(value, key) {
    if (QUERY_OPS.indexOf(key) > -1) {
      shape = 1;
    } else if (_.isArray(value)) {
      shape[key] = parseQueryShapeArray(value);
    } else if (_.isObject(value) && !_.isRegExp(value)) {
      shape[key] = parseQueryShapeObject(value);
    } else {
      shape[key] = 1;
    }
  });

  debug('parsed query shape: %j -> %j', obj, shape);
  return shape;
}

function parseQueryShapeArray(shapes) {
  return _.chain(shapes)
    .each(function(shape) {
      if (_.isObject(shape)) {
        parseQueryShapeObject(shape);
      }
    })
    .sort()
    .value();
}

module.exports = parseQueryShapeObject;
