/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


exports.init = function() {};
exports.create = function(cwd, name, type, cb) { cb && cb(null); };
exports.update = function(cwd, name, cb) { cb && cb(null); };
exports.destroy = function(cwd, name, cb) { cb && cb(null); };
exports.runTests = function(name, cb) { cb && cb(0, "woot!"); };
exports.getTestResults = function(cwd, name, cb) { cb && cb(null); };

