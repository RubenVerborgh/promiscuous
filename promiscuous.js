/** @license MIT - promiscuous library - ©2013 Ruben Verborgh */
(function (target) {
  var func = "function",
      next = typeof process !== 'undefined' && process.nextTick ? process.nextTick : setTimeout;

  // Creates a deferred: an object with a promise and corresponding resolve/reject methods
  function createDeferred() {
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected, onProgress) call
    // 2) handle a .resolve, .reject or .notify call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
    var handler = function (onFulfilled, onRejected, onProgress) {
      // Case 1) handle a .then(onFulfilled, onRejected, onProgress) call
      if (onFulfilled !== handler) {
        var d = createDeferred();
        handler.c.push({ d: d, resolve: onFulfilled, reject: onRejected, notify: onProgress });
        return d.promise;
      }

      // Case 2) handle a .resolve or .reject call
      // (`onFulfilled` acts as a sentinel)
      // The actual function signature is
      // .[reject|resolve|notify](sentinel, action, value)
      for (var i = 0, l = handler.c.length; i < l; i++) {
        var c = handler.c[i], deferred = c.d, callback = c[onRejected];
        if (typeof callback !== func)
          deferred[onRejected](onProgress);
        else
          execute(callback, onProgress, deferred);
      }
      // Replace this handler with a simple resolved or rejected handler
      if (onRejected !== 'notify')
        handler = createHandler(promise, onProgress, onRejected);
    },
    promise = {
      then: function (onFulfilled, onRejected, onProgress) {
        return handler(onFulfilled, onRejected, onProgress);
      }
    };
    // The queue of deferreds
    handler.c = [];

    return {
      promise: promise,
      // Only resolve/reject/notify when there is a deferred queue
      resolve: function (value)  { handler.c && handler(handler, 'resolve', value); },
      reject : function (reason) { handler.c && handler(handler, 'reject', reason); },
      notify : function (progress) { handler.c && handler(handler, 'notify', progress); }
    };
  }

  // Creates a fulfilled or rejected .then function
  function createHandler(promise, value, action) {
    return function (onFulfilled, onRejected, onProgress) {
      var callback = action === 'resolve' ? onFulfilled : action === 'reject' ? onRejected : onProgress, result;
      if (typeof callback !== func)
        return promise;
      execute(callback, value, result = createDeferred());
      return result.promise;
    };
  }

  // Executes the callback with the specified value,
  // resolving or rejecting the deferred
  function execute(callback, value, deferred) {
    next(function () {
      try {
        var result = callback(value);
        if (result && typeof result.then === func)
          result.then(deferred.resolve, deferred.reject);
        else
          deferred.resolve(result);
      }
      catch (error) {
        deferred.reject(error);
      }
    });
  }

  target[0][target[1]] = {
    // Returns a resolved promise
    resolve: function (value) {
      var promise = {};
      promise.then = createHandler(promise, value, true);
      return promise;
    },
    // Returns a rejected promise
    reject: function (reason) {
      var promise = {};
      promise.then = createHandler(promise, reason, false);
      return promise;
    },
    // Returns a deferred
    deferred: createDeferred,
    // Turns an array of promises into a promise for an array
    all: function (promises) {
      var deferred = createDeferred(), results = [], isRejected;
      function reject(err) {
        if (isRejected) return; // already rejected
        isRejected = true;
        deferred.reject(err);
      }
      function resolveOne(result) {
        if (isRejected) return; // already rejected
        results.push(result);
        if (results.length === promises.length) {
          // resolve only once all results are in
          deferred.resolve(results);
        }
      }
      for (var i = 0; i < promises.length; i++) {
        promises[i].then(resolveOne, reject, deferred.notify);
      }
      return deferred.promise;
    }
  };
})(typeof module !== 'undefined' ? [module, 'exports'] : [window, 'promiscuous']);
