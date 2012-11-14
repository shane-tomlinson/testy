/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const path            = require('path'),
      fs              = require('fs'),
      fs_extra        = require('fs-extra'),
      EventEmitter    = require('events').EventEmitter,
      toolbelt        = require('./toolbelt'),
      allowed_users   = require('../etc/allowed-users').allowed_users;

// these are overridable to allow for mocks.
var   git             = require('./git'),
      deployer        = require('./deployer');

var testsBeingRun;

exports.init = function(config, done) {
  testsBeingRun = config.testsBeingRun;

  if (config.git) git = config.git;
  if (config.deployer) deployer = config.deployer;

  done && done(null);
};

exports.run_tests = function(sha, repoURL) {
  var testRunner = new TestRunner(sha, repoURL);
  return testRunner;
};

function TestRunner(sha, repoURL) {
  if (!sha) {
    throw new Error("sha must be specified");
  }

  if (!repoURL) {
    throw new Error("repoURL must be specified");
  }

  this.sha = sha,
  this.repoURL = repoURL;

  EventEmitter.call(this);
}
TestRunner.prototype = new EventEmitter();
toolbelt.extend(TestRunner.prototype, {
  getRepoURL: function() { return this.repoURL; },
  getSHA: function() { return this.sha; },
  start: function() {
    var self = this,
        repoURL = this.repoURL,
        sha = this.sha;

    checkRepoAllowed(repoURL, function(err, allowed) {
      if (!allowed) {
        err = new Error("not allowed");
        this.emit("error", err);
        return;
      }

      // get the instance name, append a random number onto the end to help avoid
      // collisions
      var aws_instance_name = "testy-" + sha.substr(0, 7) + "-" + Math.floor(10000 * Math.random());

      // since multiple tests can be running at the same time, keep a small state
      // momento that we can use to keep track of which directory/instance to
      // remove when teardown occurs.
      var state = self.state = {
        dir_to_remove: undefined,
        instance_to_remove: undefined,
        sha: sha,
        repo: repoURL,
        // If this is a github repo, prettify the printed URL.
        github_repo_url: repoURL.indexOf("github.com") > -1 ? repoURL.replace(/^git:/, 'https:').replace(/\.git$/, '') : null
      };

      testsBeingRun.push(state);

      // process:
      // 1) make a temp directory to clone repo into
      // 2) clone the repo
      // 3) check out the correct sha
      // 4) install the deps
      // 5) create an ephemeral instance
      // 6) update the ephemeral instance
      // 7) run the tests
      // 8) get the results
      // 9) delete the ephemeral instance
      // 10) remove the temporary directory
      var tempDirPath = path.join(__dirname, "..", "var", aws_instance_name);
      fs_extra.mkdirp(tempDirPath, function(err) {
        if(checkErr.call(self, err)) return;

        sendUpdate.call(self, " >>> temporary directory created, cloning repo: " + repoURL);

        state.dir_to_remove = tempDirPath;

        git.clone(tempDirPath, repoURL, function(err) {
          if(checkErr.call(self, err)) return;

          sendUpdate.call(self, " >>> successful clone of repo: " + repoURL + ", checking out " + sha);

          git.checkout(tempDirPath, sha, "branch_to_test", function(err) {
            if(checkErr.call(self, err)) return;

            sendUpdate.call(self, " >>> checked out: " + sha + ", installing dependencies");

            git.install_deps(tempDirPath, "awsbox", function(err) {
              if(checkErr.call(self, err)) return;

              git.install_deps(tempDirPath, "temp", function(err) {
                if(checkErr.call(self, err)) return;

                sendUpdate.call(self, " >>> dependencies installed, creating AWS instance: " + aws_instance_name);

                deployer.create(tempDirPath, aws_instance_name, "c1.medium", function(err) {
                  if(checkErr.call(self, err)) return;

                  sendUpdate.call(self, " >>> " + aws_instance_name + " created, pushing code");
                  state.instance_to_remove = aws_instance_name;

                  deployer.update(tempDirPath, aws_instance_name, function(err) {
                    if(checkErr.call(self, err)) return;

                    sendUpdate.call(self, " >>> code pushed, running tests");

                    deployer.runTests(aws_instance_name, function(code, r) {
                      sendUpdate.call(self, " >>> tests run, exited with code: " + code);
                      self.emit("done", r);
                      teardown.call(self);
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
});


function checkErr(err) {
  if (err) {
    var state = this.state;

    console.error(err);
    var msg = " >>> Aborting";

    if (state && state.sha) msg += ": " + state.sha;
    msg += " - error code: " + String(err);

    this.emit("error", err);

    teardown.call(this);

    return true;
  }
}

var statusUpdateTimeout;
function teardown(done) {
  if (statusUpdateTimeout) {
    clearTimeout(statusUpdateTimeout);
    statusUpdateTimeout = null;
  }

  var state = this.state;
  if (state) {
    var index = testsBeingRun.indexOf(state);
    if (index > -1) {
      testsBeingRun.splice(index, 1);
    }

    if (state.instance_to_remove) {
      deployer.destroy(state.dir_to_remove, state.instance_to_remove, function() {
        fs_extra.remove(state.dir_to_remove, done);
      });
    } else if (state.dir_to_remove) {
      fs_extra.remove(state.dir_to_remove, done);
    }
  }
}

// write out occasional updates so the HTTP connection is not closed.
function sendUpdate(update) {
  var self=this;
  self.emit("update", update + "\n");

  // clear the old timeouts
  if (statusUpdateTimeout) {
    clearTimeout(statusUpdateTimeout);
    statusUpdateTimeout = null;
  }

  function sendWaitingUpdate() {
    self.emit("update", "   ... waiting ...\n");
    statusUpdateTimeout = setTimeout(sendWaitingUpdate, 20000);
  }

  statusUpdateTimeout = setTimeout(sendWaitingUpdate, 20000);
}

function checkRepoAllowed(repoURL, done) {
  var repoOwner = git.owner(repoURL);
  var allowed = allowed_users.indexOf(repoOwner) > -1;

  done && done(null, allowed);
}

