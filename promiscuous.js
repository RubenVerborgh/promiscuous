/**@license MIT-promiscuous library-©2013 Ruben Verborgh*/
(function (func, obj, Then, Promise, Resolve, Reject, promiscuous) {
  // Type checking utility function
  function is(type, item) { return (typeof item)[0] == type; }

  // Creates a deferred: an object with a promise and corresponding resolve/reject methods.
  // Arguments are ignored.
  function createDeferred(handler, deferred) {
    // The `handler` variable points to the function that will
    // 1) handle a .then(onResolved, onRejected) call
    // 2) handle a .resolve or .reject call (if not resolved)
    // Before 2), `handler` holds a queue of callbacks.
    // After 2), `handler` is a finalized .then handler.
    // We use only one function to save memory and complexity.
    handler = function pendingHandler(onResolved, onRejected, value, queue, then, i, head) {
      // Case 1) handle a .then(onResolved, onRejected) call
      queue = pendingHandler.q;
      if (onResolved != promiscuous) {
        queue.push({ d: value = createDeferred(), 1: onResolved, 0: onRejected });
        return value[Promise];
      }

      // Case 2) handle a .resolve or .reject call
      // (`onResolved` acts as a sentinel)
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
          // If no callback, just resolve/reject the promise
          if (!is(func, onResolved = head[onRejected]))
            then[onRejected ? Resolve : Reject](value);
          // Otherwise, resolve/reject the promise with the result of the callback
          else
            finalize(then, value, onResolved);
        }
        // Replace this handler with a finalized resolved/rejected handler
        handler = createFinalizedThen(deferred[Promise], value, onRejected);
      }
    };
    // The queue of pending callbacks; garbage-collected when handler is resolved/rejected
    handler.q = [];

    // Create and return the deferred
    deferred = {};
    deferred[Promise] = { then: function (onResolved, onRejected) { return handler(onResolved, onRejected); } };
    deferred[Resolve] = function (value)  { handler(promiscuous, 1, value); };
    deferred[Reject]  = function (reason) { handler(promiscuous, 0, reason); };
    return deferred;
  }

  // Creates a resolved or rejected .then function
  function createFinalizedThen(promise, value, success) {
    return function (onResolved, onRejected) {
      onResolved = success ? onResolved : onRejected;
      if (!is(func, onResolved))
        return promise;
      finalize(onRejected = createDeferred(), value, onResolved);
      return onRejected[Promise];
    };
  }

  // Finalizes the deferred by resolving/rejecting it with the transformed value
  function finalize(deferred, value, transform) {
    setImmediate(function () {
      try {
        // Transform the value through and check whether it's a promise
        value = transform(value);
        transform = value && (is(obj, value) | is(func, value)) && value[Then];
        // Return the result if it's not a promise
        if (!is(func, transform))
          deferred[Resolve](value);
        // If it's a promise, make sure it's not circular
        else if (value == deferred[Promise])
          deferred[Reject](new TypeError());
        // Take over the promise's state
        else
          transform.call(value, deferred[Resolve], deferred[Reject]);
      }
      catch (error) { deferred[Reject](error); }
    });
  }

  // Export the main module
  promiscuous = module.exports = { deferred: createDeferred };
  promiscuous[Resolve] = function (value, promise) {
    return (promise = {})[Then] = createFinalizedThen(promise, value,  1), promise;
  };
  promiscuous[Reject] = function (reason, promise) {
    return (promise = {})[Then] = createFinalizedThen(promise, reason, 0), promise;
  };
})('f', 'o', 'then', 'promise', 'resolve', 'reject');
