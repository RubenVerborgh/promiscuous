var promiscuous = require('../promiscuous'),
    expect = require('chai').expect;
    
require('../promiscuous-utilities');

describe('`promiscuous.all` converts an array of promises into a promise for an array', function () {
  
  function async(err, result, progress) {
    var deferred = promiscuous.deferred();
    process.nextTick(function () {
      progress && deferred.notify(progress);
      if (err) {
        deferred.reject(err);
      } else {
        deferred.resolve(result);
      }
    });
    return deferred.promise;
  }
  
  it('exposes `all` when `promiscuous-utilities` is present', function () {
    expect(promiscuous).to.respondTo('all');
  });
  
  it('resolves only when all promises are resolved', function (done) {
    promiscuous.all([
      async(null, 'result1'),
      async(null, 'result2'),
      async(null, 'result3')
    ]).then(function (results) {
      expect(results).to.have.length(3);
      expect(results[0]).to.equal('result1');
      expect(results[1]).to.equal('result2');
      expect(results[2]).to.equal('result3');
      done();
    });
  });

  it('rejects as soon as one rejection is caught', function () {
    promiscuous.all([
      async(null, 'result1'),
      async(new Error('error')),
      async(null, 'result3')
    ]).then(function (results) {
      done(new Error('should have been rejected'));
    }, function (err) {
      expect(err).to.be.an(Error);
      expect(err.message).to.equal('error');
      done();
    });
  });
  
  it('notifications are passed-through', function () {
    var progressCount = 0;
    promiscuous.all([
      async(null, 'result1', 1),
      async(null, 'result2', 2),
      async(null, 'result3', 3)
    ]).then(function (results) {
      expect(progressCount).to.equal(6);
      done();
    }, function (err) {
      throw err;
    }, function (progress) {
      progressCount += progress;
    });
  });
  
});