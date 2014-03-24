/* jshint strict:false */
/* global describe, it */
var assert = require('assert');
var Promise = require('../promiscuous');
var fail = Promise.reject(new Error('promise expected to resolved'));
var bindCallback = function (p, callback) {
  return p.then(function (result) { callback(undefined, result); }, callback.bind(null));
};

describe('Extended API', function () {
  // test suite borrowed from cujojs/when
  // source: https://github.com/cujojs/when/blob/master/test/all-test.js
  describe('Promise.all', function () {
    it('should resolve empty input', function (done) {
      bindCallback(Promise.all([]).then(
        function (result) {
          assert.deepEqual(result, []);
        }, fail
      ), done);
    });
    it('should resolve values array', function (done) {
      var input = [1, 2, 3];
      bindCallback(Promise.all(input).then(
        function (results) {
          assert.deepEqual(results, input);
        }, fail
      ), done);
    });
    it('should resolve promises array', function (done) {
      var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
      bindCallback(Promise.all(input).then(
        function (results) {
          assert.deepEqual(results, [1, 2, 3]);
        }, fail
      ), done);
    });
    it('should resolve sparse array input', function (done) {
      var input = [, 1, , 1, 1, ];
      bindCallback(Promise.all(input).then(
        function (results) {
          assert.deepEqual(results, input);
        }, fail
      ), done);
    });
    it('should reject if any input promise rejects', function (done) {
      var input = [Promise.resolve(1), Promise.reject(2), Promise.resolve(3)];
      bindCallback(Promise.all(input).then(
        fail,
        function (failed) {
          assert.equal(failed, 2);
        }
      ), done);
    });
    it('should accept a promise for an array', function (done) {
      var expected, input;
      expected = [1, 2, 3];
      input = Promise.resolve(expected);
      bindCallback(Promise.all(input).then(
        function (results) {
          assert.deepEqual(results, expected);
        }, fail
      ), done);
    });
    it('should resolve to empty array when input promise does not resolve to array', function (done) {
      bindCallback(Promise.all(Promise.resolve(1)).then(
        function (result) {
          assert.deepEqual(result, []);
        },
        fail
      ), done);
    });
  });
});
