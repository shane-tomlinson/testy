/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const allowed_users   = require('../../etc/allowed-users').allowed_users;

exports.init = function() {};
exports.clone = function(dir, repo, cb) { cb && cb(null); };
exports.checkout = function(dir, sha, branch_name, cb) { cb && cb(null); };
exports.install_deps = function(dir, dep, cb) { cb && cb(null); };
exports.owner = function(repoURL) { return allowed_users[0]; };

