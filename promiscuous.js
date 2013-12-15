/** @license MIT - promiscuous library - ©2013 Ruben Verborgh */
(function promiscuous() {
  var func = "function", obj = "object";

  // Creates a deferred: an object with a promise and corresponding resolve/reject methods
  function createDeferred() {
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected) call
    // 2) handle a .resolve or .reject call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
    var handler = function handlerFunction(onFulfilled, onRejected, value) {
          // Case 1) handle a .then(onFulfilled, onRejected) call
          if (onFulfilled !== promiscuous) {
            var d = createDeferred();
            handlerFunction.c.push({ d: d, resolve: onFulfilled, reject: onRejected });
            return d.promise;
          }

          // Case 2) handle a .resolve or .reject call
          // (`onFulfilled` acts as a sentinel)
          // The actual function signature is
          // .re[ject|solve](sentinel, success, value)

          // Check if the value is a promise and try to obtain its `then` method
          var then;
          if (value !== null && (typeof value === obj || typeof value === func)) {
            try { then = value.then; }
            catch (reason) { onRejected = false; value = reason; }
          }
          // If the value is a promise, take over its state
          if (typeof then === func) {
            // Make a local copy of the _current_ handler
            onFulfilled = handler;
            try {
              then.call(this, function (value) {
                then && (then = null, onFulfilled(promiscuous, true, value));
              },
              function (reason) {
                then && (then = null, onFulfilled(promiscuous, false, reason));
              });
            }
            catch (reason) {
              then && (then = null, onFulfilled(promiscuous, false, reason));
            }
          }
          // The value is not a promise; handle resolve/reject
          else {
            var action = onRejected ? 'resolve' : 'reject', queue = handlerFunction.c;
            for (var i = 0, l = queue.length; i < l; i++) {
              var c = queue[i], deferred = c.d, callback = c[action];
              // If no callback, just fulfill the promise
              if (typeof callback !== func)
                deferred[action](value);
              // Otherwise, fulfill the promise with the result of the callback
              else
                execute(callback, value, deferred);
            }
            // Replace this handler with a simple resolved or rejected handler
            handler = createHandler(promise, value, onRejected);
          }
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
      resolve: function (value)  { handler.c && handler(promiscuous, true, value); },
      reject : function (reason) {
        if (handler.c) {
          if (!handler.c.length) {
            delete handler.c;
            throw reason;
          }
          handler(promiscuous, false, reason);
        }
      }
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
            then = (result !== null && (typeof result === obj || typeof result === func)) && result.then;
        if (typeof then !== func)
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
