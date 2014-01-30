#!/usr/bin/env node
var fs = require("fs");
var UglifyJS = require("uglify-js");

var full = fs.readFileSync("promiscuous.js", "utf8");
var copyright = full.match(/.*\n/)[0];
var minified = copyright + UglifyJS.minify(full, { fromString: true }).code;
var browserFull = full.replace("module.exports", "window.Promise")
                      .replace("setImmediate", "setTimeout");
var browser = copyright + UglifyJS.minify(browserFull, { fromString: true }).code
                                  .replace("window.Promise", "Promise");

var path = "dist/";
if(!fs.existsSync(path))
  fs.mkdirSync(path);

fs.writeFileSync(path + "promiscuous-node.js", minified);
fs.writeFileSync(path + "promiscuous-browser.js", browser);
fs.writeFileSync(path + "promiscuous-browser-full.js", browserFull);
fs.writeFileSync(path + "promiscuous-shim.js",
                 browser.replace("!", "(typeof Promise)[0]!='u'||"));
