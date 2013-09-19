/** @license MIT - promiscuous library - ©2013 Ruben Verborgh */
(function () {
  var func = "function";

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
    process.nextTick(function () {
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

  module.exports = {
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
    deferred: createDeferred
  };
})();
