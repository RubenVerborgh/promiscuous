#!/usr/bin/env node
var fs = require("fs");
var UglifyJS = require("uglify-js");

var full = fs.readFileSync("promiscuous-umd.js", "utf8");
var copyright = full.match(/\/\*{2}([\s\S]+?)\*\//g)[0];
var minified = copyright + UglifyJS.minify(full, { fromString: true }).code;

var path = "dist/";
if(!fs.existsSync(path))
  fs.mkdirSync(path);

fs.writeFileSync(path + "promiscuous-min.js", minified);