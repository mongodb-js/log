var map = require('lodash.map');
var isObject = require('lodash.isobject');
var isRegExp = require('lodash.isregexp');
var isArray = require('lodash.isarray');
var clone = require('lodash.clone');
var debug = require('debug')('mongodb-log:parse-query-shape');

var QUERY_OPS = '$exists $gt $gte $in $lt $lte $nin $regex'.split(' ');

function parseQueryShapeObject(obj) {
  var shape = {};
  map(clone(obj), function(value, key) {
    if (QUERY_OPS.indexOf(key) > -1) {
      shape = 1;
    } else if (isArray(value)) {
      shape[key] = parseQueryShapeArray(value);
    } else if (isObject(value) && !isRegExp(value)) {
      shape[key] = parseQueryShapeObject(value);
    } else {
      shape[key] = 1;
    }
  });

  debug('parsed query shape: %j -> %j', obj, shape);
  return shape;
}

function parseQueryShapeArray(shapes) {
  map(function(shape) {
    if (isObject(shape)) {
      parseQueryShapeObject(shape);
    }
  });
  shapes.sort();
  return shapes;
}

module.exports = parseQueryShapeObject;
