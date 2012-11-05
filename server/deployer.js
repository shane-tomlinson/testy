/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const child_process     = require('child_process'),
      path              = require('path'),
      fs                = require('fs');

var deployerCmd = function(cmd, args, cwd, cb) {
  // deploy.js does all its work based on the PWD variable.
  process.env['PWD'] = cwd;
  process.env['GIT_DIR'] = path.join(cwd, ".git");
  process.env['GIT_WORK_TREE'] = cwd;
  if (!process.env['PERSONA_BROWSER']) {
    // If not already defined, force selenium tests to run
    // against all browsers.
    process.env['PERSONA_BROWSER'] = 'all';
  }

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
  console.log(" >>> updating aws instance", name);
  deployerCmd("update", [name], cwd, cb);
};

exports.destroy = function(cwd, name, cb) {
  console.log(" >>> destroying aws instance", name);
  deployerCmd("destroy", [name], cwd, cb);
};

exports.getTestResults = function(cwd, name, cb) {
  console.log(" >>> getting test results from aws instance", name);

  var resultsPath = path.join(cwd, "results");

  // make the results path if it does not exist.
  if (!fs.existsSync(resultsPath)) {
    fs.mkdirSync(resultsPath);
  }

  process.env['PWD'] = resultsPath;
  var options = {
    cwd: resultsPath,
    env: process.env
  };

  var cmd = 'scp -o "StrictHostKeyChecking no" app@' + name + ".personatest.org:code/automation-tests/results/*.xml .";

  var p = child_process.exec(cmd, options, function(err, r) {
    var results = getResultsFromDirectory(resultsPath);
    cb(null, results);
  });
  p.stdout.pipe(process.stdout);
  p.stderr.pipe(process.stderr);
};

function getResultsFromDirectory(dir, done) {
  var buffer = "";

  try {
    var files = fs.readdirSync(dir);
    files.forEach(function(file) {
      var filePath = path.join(dir, file);
      var stats = fs.lstatSync(filePath);
      if (stats.isFile()) {
        if (/\.xml$/.test(file)) {
          var resultContents = fs.readFileSync(filePath, 'utf8');

          buffer += ("\n" + resultContents);
        }
      }
    });
  } catch(e) {
    console.log(e.toString());
    return;
  }

  return buffer;
}

