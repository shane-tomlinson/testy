/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const child_process     = require('child_process');

var deployerCmd = function(cmd, args, cwd, cb) {
  console.log("cwd", cwd);

  // deploy.js does all its work based on the PWD variable.
  process.env['PWD'] = cwd;

  var options = {
    cwd: cwd,
    env: process.env
  };

  var p = child_process.spawn("./scripts/deploy.js", [ cmd ].concat(args), options);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  p.on('exit', cb);
};

exports.create = function(cwd, name, type, cb) {
  if (!cb) {
    cb = type;
    type = "c1.medium";
  }

  console.log(" >>> creating aws instance", name);
  deployerCmd("create", [name, "-t", type], cwd, cb);
};

exports.update = function(cwd, name, cb) {
  console.log(" >>> Updating aws instance", name);
  deployerCmd("update", [name], cwd, cb);
};

exports.destroy = function(cwd, name, cb) {
  console.log(" >>> destroying aws instance", name);
  deployerCmd("destroy", [name], cwd, cb);
};

