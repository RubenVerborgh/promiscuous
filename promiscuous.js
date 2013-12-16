/**@license MIT-promiscuous library-©2013 Ruben Verborgh*/
(function (func, obj, Then, Promise, Resolve, Reject, promiscuous) {
  // Type checking utility function
  function is(type, item) { return (typeof item)[0] == type; }

  // Creates a deferred: an object with a promise and corresponding resolve/reject methods.
  // Arguments are ignored.
  function createDeferred(handler, deferred) {
    // The `handler` variable points to the function that will
    // 1) handle a .then(onFulfilled, onRejected) call
    // 2) handle a .resolve or .reject call (if not fulfilled)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a simple .then handler.
    // We use only one function to save memory and complexity.
    handler = function pendingHandler(onFulfilled, onRejected, value, queue, then, i, head) {
      // Case 1) handle a .then(onFulfilled, onRejected) call
      queue = pendingHandler.q;
      if (onFulfilled != promiscuous) {
        queue.push({ d: value = createDeferred(), 1: onFulfilled, 0: onRejected });
        return value[Promise];
      }

      // Case 2) handle a .resolve or .reject call
      // (`onFulfilled` acts as a sentinel)
      // The actual function signature is
      // .re[ject|solve](sentinel, success, value)

      // Check if the value is a promise and try to obtain its `then` method
      if (value && (is(func, value) | is(obj, value))) {
        try { then = value[Then]; }
        catch (reason) { onRejected = 0; value = reason; }
      }
      // If the value is a promise, take over its state
      if (is(func, then)) {
        function valueHandler(resolved) {
          return function (value) { then && (then = 0, pendingHandler(promiscuous, resolved, value)); };
        }
        try { then.call(value, valueHandler(1), onRejected = valueHandler(0)); }
        catch (reason) { onRejected(reason); }
      }
      // The value is not a promise; handle resolve/reject
      else {
        i = 0;
        while (i < queue.length) {
          then = (head = queue[i++]).d;
          // If no callback, just fulfill the promise
          if (!is(func, onFulfilled = head[onRejected]))
            then[onRejected ? Resolve : Reject](value);
          // Otherwise, fulfill the promise with the result of the callback
          else
            execute(onFulfilled, value, then);
        }
        // Replace this handler with a simple resolved or rejected handler
        handler = createHandler(deferred[Promise], value, onRejected);
      }
    };
    // The queue of deferreds; garbage-collected when handler is resolved/rejected
    handler.q = [];

    // Create and return the deferred
    deferred = {};
    deferred[Promise] = { then: function (onResolve, onReject) { return handler(onResolve, onReject); } };
    deferred[Resolve] = function (value)  { handler(promiscuous, 1, value); };
    deferred[Reject]  = function (reason) { handler(promiscuous, 0, reason); };
    return deferred;
  }

  // Creates a fulfilled or rejected .then function
  function createHandler(promise, value, success) {
    return function (onFulfilled, onRejected) {
      onFulfilled = success ? onFulfilled : onRejected;
      if (!is(func, onFulfilled))
        return promise;
      execute(onFulfilled, value, onRejected = createDeferred());
      return onRejected[Promise];
    };
  }

  // Executes the callback with the specified value,
  // resolving or rejecting the deferred
  function execute(callback, value, deferred) {
    setImmediate(function () {
      try {
        // Transform the value through the callback and check whether it's a promise
        value = callback(value);
        callback = value && (is(obj, value) | is(func, value)) && value[Then];
        // Return the result if it's not a promise
        if (!is(func, callback))
          deferred[Resolve](value);
        // If it's a promise, make sure it's not circular
        else if (value == deferred[Promise])
          deferred[Reject](new TypeError());
        // Take over the promise's state
        else
          callback.call(value, deferred[Resolve], deferred[Reject]);
      }
      catch (error) {
        deferred[Reject](error);
      }
    });
  }

  // Export the main module
  promiscuous = module.exports = { deferred: createDeferred };
  promiscuous[Resolve] = function (value, promise) {
    return (promise = {})[Then] = createHandler(promise, value, 1), promise;
  };
  promiscuous[Reject] = function (reason, promise) {
    return (promise = {})[Then] = createHandler(promise, reason, 0), promise;
  };
})('f', 'o', 'then', 'promise', 'resolve', 'reject');
