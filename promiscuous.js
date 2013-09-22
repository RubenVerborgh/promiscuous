/** @license MIT - promiscuous library - ©2013 Ruben Verborgh */
(function (target) {
  var func = "function",
      next = typeof process !== 'undefined' && process.nextTick ? process.nextTick : setTimeout;

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
        handler.c.push({ d: d, resolve: onFulfilled, reject: onRejected, notify: value });
        return d.promise;
      }

      // Case 2) handle a .resolve or .reject call
      // (`onFulfilled` acts as a sentinel)
      // The actual function signature is
      // .re[ject|solve](sentinel, success, value)
      var action = onRejected ? 'resolve' : 'reject';
      for (var i = 0, l = handler.c.length; i < l; i++) {
        var c = handler.c[i], deferred = c.d, callback = c[action];
        if (typeof callback !== func)
          deferred[action](value);
        else
          execute(callback, value, deferred);
      }
      // Replace this handler with a simple resolved or rejected handler
      handler = createHandler(promise, value, onRejected);
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
      // Only resolve / reject when there is a deferreds queue
      resolve: function (value)  { handler.c && handler(handler, true, value); },
      reject : function (reason) { handler.c && handler(handler, false, reason); },
      // Notify simply fires progress callbacks
      notify : function (progress) {
        if (!handler.c) return;
        var callbacks = handler.c;
        next(function () {
          for (var i = 0, l = callbacks.length; i < l; i++) {
            callbacks[i].notify && callbacks[i].notify(progress);
          }
        });
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
    deferred: createDeferred
  };
})(typeof module !== 'undefined' ? [module, 'exports'] : [window, 'promiscuous']);
