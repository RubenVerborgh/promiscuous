/* jshint strict:false */
/* global describe, it */
var assert = require('assert');
var Promise = require('../promiscuous');
var fail = Promise.reject(new Error('invalid promise resolution'));
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
        },
        fail
      ), done);
    });
    it('should resolve values array', function (done) {
      var input = [1, 2, 3];
      bindCallback(Promise.all(input).then(
        function (results) {
          assert.deepEqual(results, input);
        },
        fail
      ), done);
    });
    it('should resolve promises array', function (done) {
      var input = [Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)];
      bindCallback(Promise.all(input).then(
        function (results) {
          assert.deepEqual(results, [1, 2, 3]);
        },
        fail
      ), done);
    });
    it('should resolve sparse array input', function (done) {
      var input = [, 1, , 1, 1, ];
      bindCallback(Promise.all(input).then(
        function (results) {
          assert.deepEqual(results, input);
        },
        fail
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
        },
        fail
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
  // test suite borrowed from cujojs/when
  // source: https://github.com/cujojs/when/blob/master/test/defer-test.js
  describe.only('Promise.defer', function () {
    var sentinel = {};
    function fakeResolved(val) {
      return {
        then: function (callback) {
          return fakeResolved(callback ? callback(val) : val);
        }
      };
    }
    function fakeRejected(reason) {
      return {
        then: function (callback, errback) {
          return errback ? fakeResolved(errback(reason)) : fakeRejected(reason);
        }
      };
    }
    describe('resolve', function () {
      it('should fulfill with an immediate value', function (done) {
        var d = Promise.defer();

        bindCallback(d.promise.then(
          function (val) {
            assert.strictEqual(val, sentinel);
          },
          fail
        ), done);

        d.resolve(sentinel);
      });
      it('should fulfill with fulfilled promised', function (done) {
        var d = Promise.defer();

        bindCallback(d.promise.then(
          function (val) {
            assert.strictEqual(val, sentinel);
          },
          fail
        ), done);

        d.resolve(fakeResolved(sentinel));
      });

      it('should reject with rejected promise', function (done) {
        var d = Promise.defer();

        bindCallback(d.promise.then(
          fail,
          function (val) {
            assert.strictEqual(val, sentinel);
          }
        ), done);

        d.resolve(fakeRejected(sentinel));
      });

      it('should invoke newly added callback when already resolved', function (done) {
        var d = Promise.defer();

        d.resolve(sentinel);

        bindCallback(d.promise.then(
          function (val) {
            assert.strictEqual(val, sentinel);
          },
          fail
        ), done);
      });
    });
    describe('reject', function () {
      it('should reject with an immediate value', function (done) {
        var d = Promise.defer();

        bindCallback(d.promise.then(
          fail,
          function (val) {
            assert.strictEqual(val, sentinel);
          }
        ), done);

        d.reject(sentinel);
      });

      it('should reject with fulfilled promised', function (done) {
        var d, expected;

        d = Promise.defer();
        expected = fakeResolved(sentinel);

        bindCallback(d.promise.then(
          fail,
          function (val) {
            assert.strictEqual(val, expected);
          }
        ), done);

        d.reject(expected);
      });

      it('should reject with rejected promise reason', function (done) {

        var d, expected;

        d = Promise.defer();
        expected = fakeRejected(sentinel);

        bindCallback(d.promise.then(
          fail,
          function (val) {
            // variation from `when` to `promiscuous`:
            // rejecting with a rejected promise returns the reason, not the rejected promise
            // assert.strictEqual(val, expected);
            assert.strictEqual(val, sentinel);
          }
        ), done);

        d.reject(expected);
      });

      it('should invoke newly added errback when already rejected', function (done) {
        var d = Promise.defer();

        d.reject(sentinel);

        bindCallback(d.promise.then(
          fail,
          function (val) {
            assert.equal(val, sentinel);
          }
        ), done);
      });
    });
  });
});
