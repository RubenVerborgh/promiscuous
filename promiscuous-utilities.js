(function (promiscuous) {
  // Turns an array of promises into a promise for an array
  promiscuous.all = function (promises) {
    var deferred = promiscuous.deferred(), results = [];
    function resolveOne(result) {
      results.push(result);
      if (results.length === promises.length) {
        // resolve only once all results are in
        deferred.resolve(results);
      }
    }
    for (var i = 0; i < promises.length; i++) {
      promises[i].then(resolveOne, deferred.reject, deferred.notify);
    }
    return deferred.promise;
  };
})(typeof require !== 'undefined' ? require('./promiscuous') : window.promiscuous);
