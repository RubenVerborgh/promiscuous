# promiscuous
<a href="http://promises-aplus.github.com/promises-spec">
  <img src="http://promises-aplus.github.com/promises-spec/assets/logo-small.png"
       alt="Promises/A+ logo" title="Promises/A+ 1.0 compliant" align="right" />
</a>

promiscuous is the smallest implementation of the [Promises/A+ spec](http://promises-aplus.github.com/promises-spec/).

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
var one = Promise.resolve("one");
one.then(function (value) { console.log(value); });
/* one */
```

### Create a rejected promise
```javascript
var none = Promise.reject(new Error("Could not keep promise."));
none.then(null, function (error) { console.error(error.message); });
/* "Could not keep promise." */
```

### Write a function that returns a promise
```javascript
function promiseSomethingInASecond(something) {
  return new Promise(function (resolve, reject) {
    setTimeout(function () {
      if (something)
        resolve(something);
      else
        reject(new Error("nothing"));
    }, 1000);
  });
}
promiseSomethingInASecond("something").then(
  function (value) { console.log(value); },
  function (error) { console.error(error.message); });
/* something */
```
