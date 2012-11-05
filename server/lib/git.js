/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const child_process     = require('child_process'),
      spawn             = child_process.spawn,
      path              = require('path');

// getEnv is used to pass all the rest of the environment variables to git.
// This prevents the user from being required to enter their password on a git
// push
function getEnv(extraEnv) {
  var env = {};

  // copy over the original environment
  for(var key in process.env) {
    env[key] = process.env[key];
  }

  // add each item in extraEnv
  for(var key in extraEnv) {
    env[key] = extraEnv[key];
  }

  return env;
}

function gitCommand(cmd, args, dir, cb) {
  var env = dir ? getEnv({
    GIT_DIR: path.join(dir, ".git"),
    GIT_WORK_TREE: dir
  }) : getEnv();

  spawnCommand('git', [ cmd ].concat(args), {
    env: env
  }, cb);
}

function spawnCommand(cmd, args, opts, cb) {
  var p = spawn(cmd, args, opts);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  p.on('exit', function(code, signal) {
    return cb(code);
  });

  return p;
}

exports.clone = function(dir, repo, cb) {
  var env = getEnv();

  spawnCommand('git', [ 'clone', repo, dir ], {
    env: env
  }, cb);
};

exports.checkout = function(dir, sha, branch_name, cb) {
  gitCommand('checkout', [ sha, "-b", branch_name ], dir, cb);
};

exports.install_deps = function(dir, dep, cb) {
  if (!cb) {
    cb = dep;
    dep = null;
  }

  var args = ['install'];

  if (dep) args.push(dep);

  spawnCommand('npm', args, {
    cwd: dir,
    env: process.env
  }, cb);
};

