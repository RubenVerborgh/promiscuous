# promiscuous
<a href="http://promises-aplus.github.com/promises-spec">
  <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
       alt="Promises/A+ logo" title="Promises/A+ 1.0 compliant" align="right" />
</a>

promiscuous is a tiny implementation of the [Promises/A+ spec](http://promises-aplus.github.com/promises-spec/).

It is promise library in JavaScript, **small** (< 1kb [minified](https://raw.github.com/RubenVerborgh/promiscuous/dist/promiscuous-node.js) / < 0.6kb gzipped) and **fast**.

## Installation and usage
### Node
First, install promiscuous with npm.
```bash
$ npm install promiscuous
```

Then, include promiscuous in your code file.
```javascript
var Promise = require('promiscuous');
```

### Browsers
Include [promiscuous](https://raw.github.com/RubenVerborgh/promiscuous/dist/promiscuous-browser.js) in your HTML file.
```html
<script src="promicuous-browser.js"></script>
```

This version (and a minified one) can be built with:
```bash
$ build/build.js
```

## API
### Create a resolved promise
```javascript
var promise = Promise.resolve("one");
promise.then(function (value) { console.log(value); });
/* one */
```

### Create a rejected promise
```javascript
var brokenPromise = Promise.reject(new Error("Could not keep promise."));
brokenPromise.then(null, function (error) { console.error(error.message); });
/* "Could not keep promise." */
```

You can also use the `catch` method if there is no success callback:

```javascript
brokenPromise.catch(function (error) { console.error(error.message); });
/* "Could not keep promise." */
```

### Write a function that returns a promise
```javascript
function promiseLater(something) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (something)
        resolve(something);
      else
        reject(new Error("nothing"));
    }, 1000);
  });
}
promiseLater("something").then(
  function (value) { console.log(value); },
  function (error) { console.error(error.message); });
/* something */

promiseLater(null).then(
  function (value) { console.log(value); },
  function (error) { console.error(error.message); });
/* nothing */
```

### Convert an array of promises into a promise for an array
```javascript
var promises = [promiseLater(1), promiseLater(2), promiseLater(3)];
Promise.all(promises).then(function (values) { console.log(values); });
/* [1, 2, 3] */
```

### Create queue of functions which return promises
```javascript
/**
* if ++value is less than 4, return promise has been resolved with ++value
* if ++value equals 4, return promise has been rejected with ++value
* @param {Number} value
*/
function getInc(value) {
  return new Promise(function(resolve, reject) {
    setTimeout(function() {
      console.log(value);
      if (++value < 4) {
        resolve(value);
      } else {
        reject(value);
      }
    }, 100);
  });
}

var firstNumber = 1;
var resultPromise = Promise.queue([getInc, getInc, getInc, getInc, getInc], firstNumber);
resultPromise.then(function(value) {
  console.log('promise has been resolved with %d value', value);
  }, function(value) {
    console.log('promise has been rejected with "%d" value', value);
  });
/* 1 2 3 'promise has been rejected with "4" value" */

var nextResultPromise = Promise.queue([getInc, getInc], firstNumber);
nextResultPromise.then(function(value) {
  console.log('promise has been resolved with %d value', value);
  }, function(value) {
    console.log('promise has been rejected with "%d" value', value);
  });
/* 1 2 'promise has been resolved with "3" value" */
```
