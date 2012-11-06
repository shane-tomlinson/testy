/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const child_process     = require('child_process'),
      path              = require('path'),
      url               = require('url'),
      toolbelt          = require('./toolbelt');

// overridable for testing
var   spawn             = child_process.spawn;

// getEnv is used to pass all the rest of the environment variables to git.
// This prevents the user from being required to enter their password on a git
// push
function getEnv(extraEnv) {
  var env = toolbelt.copyExtendEnv(extraEnv);
  return env;
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

exports.init = function(config) {
  if (config.spawn) spawn = config.spawn;
};

exports.clone = function(dir, repo, cb) {
  spawnCommand('git', [ 'clone', repo, dir ], {
    env: getEnv()
  }, cb);
};

exports.checkout = function(dir, sha, branch_name, cb) {
  spawnCommand('git', [ 'checkout', sha, "-b", branch_name ], {
    cwd: dir,
    env: getEnv({
      GIT_DIR: path.join(dir, ".git"),
      GIT_WORK_TREE: dir
    })
  }, cb);
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
    env: getEnv()
  }, cb);
};

exports.owner = function(repoURL) {
  var owner;

  if (/^https:\/\//.test(repoURL) || /^git:\/\//.test(repoURL)) {
    var parsedURL = url.parse(repoURL);
    owner = parsedURL.path.split("/")[1];
  }
  else {
    owner = /:([^\/]*)\//.exec(repoURL)[1];
  }

  return owner;
}


