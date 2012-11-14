/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const test_runner       = require('./test-runner'),
      results           = require('./results');

const MSG_NOT_ALLOWED   = "This repo cannot be tested by testy";

var runners = {};

exports.init = function(config, done) {
  test_runner.init(config, done);
};

exports.start_test = function(sha, repoURL, res) {
  // Yes, this is right. This means if a POST comes in on this sha and repoURL,
  // if a runner is not already running with this SHA, a new set of results
  // will be generated and the old results blown away. This allows us to force
  // the re-running of a test on a particular SHA.
  if (!runners[sha]) {
    var runner = createRunner(sha, repoURL, res);
    runner.start();
  }
  else {
    exports.get_test(sha, repoURL, res);
  }
};

exports.get_test = function(sha, repoURL, res) {
  // See if the test is being run. If it is, bind the response to the current
  // runner. If no runner exists, see if a results set exists. If it exists and
  // the status is done, hand the results back. If the status is "pending", we
  // have a problem.
  results.get_result(sha, repoURL, function(err, data) {
    if (err) {
      // ah crap.
      res.send(500, String(err));
    }
    else if (data.status === "not_found") {
      // results not found at all, start a new runner.
      exports.start_test(sha, repoURL, res);
    }
    else if (data.status === "pending") {
      // send the initial results
      res.write(data.output);

      // then attach the response to the running test_runner. Check to make
      // sure the runner exists in case there is a pending result from
      // a previous instantiation of the server.
      var runner = runners[sha];
      if (runner) {
        bindResponseToRunner(res, runner);
      }
    }
    else if (data.status === "done") {
      res.send(200, data.output);
    }
  });
};

function createRunner(sha, repoURL, res) {
  var runner = test_runner.run_tests(sha, repoURL);
  runners[sha] = runner;

  // Since there are multiple things that must be informed whenever a runner
  // updates, use a sort of model-view pattern where the runner is the model
  // that triggers events that the views must listen for.
  bindResponseToRunner(res, runner);
  bindResultToRunner(runner);

  // bind these two teardown functions after the two other runners so that the
  // runner is deleted from the list of possible runners is the last possible
  // action
  runner.on("error", done);
  runner.on("done", done);

  return runner;

  function done() {
    runners[sha] = null;
    delete runners[sha];
  }
}

function bindResponseToRunner(res, runner) {
  runner.on("error", function(err) {
    var errStr = String(err);
    var code = 500;

    try {
      if (errStr === "not allowed") {
        errStr = MSG_NOT_ALLOWED;
        code = 401;
      }

      // the headers may already be sent, if so an exception will be thrown.
      // If an exception is thrown, just continue on our merry way.
      res.send(code, errStr);
    } catch(e) {
      res.write(errStr);
    }
  });

  runner.on("update", function(data) {
    res.write(data);
  });

  runner.on("done", function(data) {
    res.end(data);
  });
}

function bindResultToRunner(runner) {
  var msg = "",
      sha = runner.getSHA(),
      repoURL = runner.getRepoURL();

  runner.on("error", function(err) {
    // If there is an error, just write the error out to disk and serve that up
    // next time
    if (String(err) === "not allowed") {
      var resultToSave = {
        status: status,
        output: MSG_NOT_ALLOWED
      };

      results.save_result(sha, repoURL, resultToSave);
    }
    else {
      updateResult("done", String(err));
    }
  });

  runner.on("update", function(data) {
    updateResult("pending", data);
  });

  runner.on("done", function(data) {
    updateResult("done", data);
  });

  function updateResult(status, data) {
    msg += data;
    var resultToSave = {
      status: status,
      output: msg
    };

    // This is a synchronous operation. Trying to make it async was very
    // difficult because it ended up being possible for a test_runner to
    // complete its business but results were not yet saved to disk, resulting
    // in a small period of time after tests were complete but before the
    // results were written to disk where it was impossible to reliably
    // query for results.
    results.save_result(sha, repoURL, resultToSave);
  }

}


