var promiscuous = require('../promiscuous'),
    expect = require('chai').expect;
    
describe('`promiscuous.deferred` allows progress callbacks using `then(success, failure, progress)`', function () {
  describe('`deferred.notify` fires progress callbacks until rejected or resolved', function () {
    
    it('reports progress until resolve', function (done) {
      
      var deferred = promiscuous.deferred(),
          progressCount = 0;
      
      process.nextTick(function () {
        deferred.notify(1);
        deferred.notify(2);
        deferred.resolve('done');
        deferred.notify(3); // should not report, already resolved
      });
      
      deferred.promise.then(function (result) {
        expect(progressCount).to.equal(3);
        done();
      }, function (err) {
        throw err;
      }, function (progress) {
        progressCount += progress;
      });
      
    });
    
    it('reports progress until reject', function (done) {
      
      var deferred = promiscuous.deferred(),
          progressCount = 0;
      
      process.nextTick(function () {
        deferred.notify(1);
        deferred.notify(2);
        deferred.reject(new Error('error'));
        deferred.notify(3); // should not report, already rejected
      });
      
      deferred.promise.then(function (result) {
        done(new Error('deferred should have been rejected'));
      }, function (err) {
        expect(progressCount).to.equal(3);
        done();
      }, function (progress) {
        progressCount += progress;
      });
      
    });
    
    it('reports progress to multiple handlers', function (done) {
      
      var deferred = promiscuous.deferred(),
          progressCount = 0;
      
      process.nextTick(function () {
        deferred.notify(1);
        deferred.notify(2);
        deferred.notify(3);
        deferred.resolve('done');
      });
      
      deferred.promise.then(function (result) {
        expect(progressCount).to.equal(12);
        done();
      }, function (err) {
        console.log(err);
        throw err;
      }, function (progress) {
        progressCount += progress;
      });
      
      deferred.promise.then(function () {}, null, function (progress) {
        progressCount += progress;
      });
            
    });
  });
});