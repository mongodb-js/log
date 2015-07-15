#!/usr/bin/env node

var suite = require('../bench');
var Table = require('cli-table');

function formatNumber(number) {
  number = String(number).split('.');
  return number[0].replace(/(?=(?:\d{3})+$)(?!\b)/g, ',')
    + (number[1] ? '.' + Number(number[1]).toFixed(2) : '');
}
suite
  .on('cycle', function(event) {
    console.log('Finished: ', this.name, String(event.target));
  })
  .on('complete', function() {
    console.log('Fastest is ' + this.filter('fastest').pluck('name'));

    var table = new Table({
      head: ['suite', 'name', 'ops/sec', '#samples', 'rme']
    });

    this.forEach(function(benchmark) {
      table.push([
        suite.name,
        benchmark.name,
        formatNumber(benchmark.hz),
        benchmark.stats.sample.length,
        benchmark.stats.rme.toFixed(2) + '%'
      ]);
    });
    console.log(table.toString());
  })
  .run({
    async: true
  });
