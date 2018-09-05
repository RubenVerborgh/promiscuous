var lolex = require('lolex');
var assert = require('assert');
var Promise = require('../promiscuous');

var resolved = false;

setTimeout(function() {
    assert.ok(resolved, 'Promise should resolve when lolex is installed');
}, 500);

lolex.install();
Promise.resolve()
    .then(function() {
        resolved = true;
    });
