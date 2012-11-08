/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const child_process     = require('child_process'),
      path              = require('path'),
      fs                = require('fs'),
      fs_extra          = require('fs-extra'),
      toolbelt          = require('./toolbelt');

// overridable for testing
var spawn               = child_process.spawn,
    exec                = child_process.exec;

exports.init = function(config) {
  if (config.spawn) spawn = config.spawn;
  if (config.exec) exec = config.exec;
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
  console.log(" >>> updating aws instance", name);
  deployerCmd("update", [name], cwd, cb);
};

exports.destroy = function(cwd, name, cb) {
  console.log(" >>> destroying aws instance", name);
  deployerCmd("destroy", [name], cwd, cb);
};

exports.runTests = function(name, cb) {
  console.log(" >>> running tests on aws instance", name);

  var cmd = 'ssh ' + getSSHOptions(name) + ' node code/automation-tests/scripts/post-update.js';

  var options = {
    cwd: undefined,
    env: process.env
  };

  var p = exec(cmd, options, cb);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
}

exports.getTestResults = function(cwd, name, cb) {
  console.log(" >>> getting test results from aws instance", name);

  var resultsPath = path.join(cwd, "results");

  // make the results path if it does not exist.
  fs_extra.mkdirsSync(resultsPath);

  var options = {
    cwd: resultsPath,
    env: toolbelt.copyExtendEnv({
      PWD: resultsPath
    })
  };

  var cmd = 'scp ' + getSSHOptions(name) + ':code/automation-tests/results/*.xml .';

  var p = exec(cmd, options, function(err, r) {
    var results = getResultsFromDirectory(resultsPath);
    cb(null, results);
  });
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
};

function getSSHOptions(name) {
  return '-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null app@' + name + '.personatest.org';
}


function getResultsFromDirectory(dir) {
  var buffer = "";

  try {
    var files = fs.readdirSync(dir);
    files.forEach(function(file) {
      var filePath = path.join(dir, file);
      var stats = fs.lstatSync(filePath);
      if (stats.isDirectory()) {
        buffer += getResultsFromDirectory(filePath);
      }
      else if (stats.isFile()) {
        if (/\.xml$/.test(file)) {
          var resultContents = fs.readFileSync(filePath, 'utf8');

          buffer += ("\n" + file + "\n" + resultContents);
        }
      }
    });
  } catch(e) {
    console.log(e.toString());
    return;
  }

  return buffer;
}

function deployerCmd(cmd, args, cwd, cb) {
  var env = toolbelt.copyExtendEnv({
    // deploy.js does all its work based on the PWD variable.
    PWD: cwd,
    GIT_DIR: path.join(cwd, ".git"),
    GIT_WORK_TREE: cwd,
    // If not already defined, force selenium tests to run
    // against all browsers.
    PERSONA_BROWSER: process.env['PERSONA_BROWSER'] || 'all'
  });

  var options = {
    cwd: cwd,
    env: env
  };

  var p = spawn("./scripts/deploy.js", [ cmd ].concat(args), options);
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
  p.on('exit', cb);
};



