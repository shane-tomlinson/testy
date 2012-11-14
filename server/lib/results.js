/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

// Keeps track of results. Results are stored in the results directory by SHA.

const path            = require("path"),
      fs              = require("fs"),
      fs_extra        = require('fs-extra');

var resultsDir = path.join(__dirname, "..", "var", "results");

exports.init = function(config, done) {
  resultsDir = config.results_dir;

  done && done(null);
};

exports.save_result = function(sha, repoURL, data, done) {
  var resultsFilePath = path.join(resultsDir, sha);
  var dataToWrite = JSON.stringify(data);
  var err;

  try {
    fs_extra.mkdirpSync(resultsDir);
    // The sync is intentional. If async is used, it ends up that multiple
    // file handles to the same file can be open, which ends up with writes
    // to the file in random orderings, which can lead to corrupted input.
    // While it is possible to ensure the files are written to in the correct
    // order by writing a queuing mechanism (this approach was already
    // tried), it still allowed for a test runner to be complete without
    // results actually being on file.
    fs.writeFileSync(resultsFilePath, dataToWrite, 'utf8');
  } catch(e) {
    err = e;
  }

  done && done(err, !err);
};

exports.get_result = function(sha, repoURL, done) {
  var resultsFilePath = path.join(resultsDir, sha);
  fs.exists(resultsFilePath, function(exists) {
    if (!exists) {
      done && done(null, { status: 'not_found' });
      return;
    }

    fs.readFile(resultsFilePath, 'utf8', function(err, data) {
      if (err) {
        done && done(err);
        return;
      }

      try {
        data = JSON.parse(data);
      }
      catch(e) {
        console.log("json parse error", e, data);
        done && done(e, null);
        return;
      }

      done && done(null, data);
    });
  });
};


exports.delete_result = function(sha, repoURL, done) {
  var resultsFilePath = path.join(resultsDir, sha);
  fs.exists(resultsFilePath, function(exists) {
    if (exists) {
      fs.unlink(resultsFilePath, done);
    }
    else {
      done(null);
    }
  });
};


