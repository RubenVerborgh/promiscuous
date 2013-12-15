/** @license MIT - promiscuous library - ©2013 Ruben Verborgh */
(function () {
  var func = "function";

  // Creates a deferred: an object with a promise and corresponding resolve/reject methods
  function createDeferred() {
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected) call
    // 2) handle a .resolve or .reject call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
    var handler = function (onFulfilled, onRejected, value) {
          // Case 1) handle a .then(onFulfilled, onRejected) call
          if (onFulfilled !== handler) {
            var d = createDeferred();
            handler.c.push({ d: d, resolve: onFulfilled, reject: onRejected });
            return d.promise;
          }

          // Case 2) handle a .resolve or .reject call
          // (`onFulfilled` acts as a sentinel)
          // The actual function signature is
          // .re[ject|solve](sentinel, success, value)
          var action = onRejected ? 'resolve' : 'reject',
              then = value && value.then;
          for (var i = 0, l = handler.c.length; i < l; i++) {
            var c = handler.c[i], deferred = c.d, callback = c[action];
            // If the resolved value is a promise, take over its state
            if (then)
              then.call(value, c.resolve, c.reject);
            // If not a promise, but no callback, just fulfill the promise
            else if (typeof callback !== func)
              deferred[action](value);
            // Otherwise, fulfill the promise with the result of the callback
            else
              execute(callback, value, deferred);
          }
          // Replace this handler with a simple resolved or rejected handler
          handler = createHandler(promise, value, onRejected);
        },
        promise = {
          then: function (onFulfilled, onRejected) {
            return handler(onFulfilled, onRejected);
          }
        };
    // The queue of deferreds
    handler.c = [];

    return {
      promise: promise,
      // Only resolve / reject when there is a deferreds queue
      resolve: function (value)  { handler.c && handler(handler, true, value); },
      reject : function (reason) { handler.c && handler(handler, false, reason); }
    };
  }

  // Creates a fulfilled or rejected .then function
  function createHandler(promise, value, success) {
    return function (onFulfilled, onRejected) {
      var callback = success ? onFulfilled : onRejected, result;
      if (typeof callback !== func)
        return promise;
      execute(callback, value, result = createDeferred());
      return result.promise;
    };
  }

  // Executes the callback with the specified value,
  // resolving or rejecting the deferred
  function execute(callback, value, deferred) {
    setImmediate(function () {
      try {
        // Return the result if it's not a promise
        var result = callback(value),
            then = result && result.then;
        if (!then)
          deferred.resolve(result);
        // If it's a promise, make sure it's not circular
        else if (result === deferred.promise)
          deferred.reject(new TypeError());
        // Take over the promise's state
        else
          then.call(result, deferred.resolve, deferred.reject);
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
