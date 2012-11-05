/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express         = require('express'),
      path            = require('path'),
      wrench          = require('wrench'),
      git             = require('./git'),
      deployer        = require('./deployer');

const DEFAULT_REPO_URL = "git://github.com/mozilla/browserid.git";

var testsBeingRun = [];

function checkErr(state, err, res) {
  if (err) {
    console.error(err);
    res.write(" >>> Aborting: " + state.sha + " - error code: " + String(err));
    res.end();
    teardown(state);

    return true;
  }
}

var statusUpdateTimeout;
function teardown(state, cb) {
  function done() {
    cb && cb();
  }

  if (statusUpdateTimeout) {
    clearTimeout(statusUpdateTimeout);
    statusUpdateTimeout = null;
  }

  var index = testsBeingRun.indexOf(state);
  if (index > -1) {
    testsBeingRun.splice(index, 1);
  }

  if (state.instance_to_remove) {
    deployer.destroy(state.dir_to_remove, state.instance_to_remove, function(err, r) {
      wrench.rmdirRecursive(state.dir_to_remove, done);
    });
  } else if (state.dir_to_remove) {
    wrench.rmdirRecursive(state.dir_to_remove, done);
  }
}

// write out occasional updates so the HTTP connection is not closed.
function sendUpdate(res, update) {
  res.write(update + "\n");

  // clear the old timeouts
  if (statusUpdateTimeout) {
    clearTimeout(statusUpdateTimeout);
    statusUpdateTimeout = null;
  }

  function sendWaitingUpdate() {
    res.write("   ... waiting ...\n");
    statusUpdateTimeout = setTimeout(sendWaitingUpdate, 20000);
  }

  statusUpdateTimeout = setTimeout(sendWaitingUpdate, 20000);
}


var app = express();

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, "views"));

app.use(express.bodyParser())
   .use(express.cookieParser())
   .use(express.session({
     secret: 'mysecret'
   }))
   .use(express.static(path.join(__dirname, "..", "client")));

app.get('/', function(req, res, next) {
  res.render('index', {
    tests: testsBeingRun
  });
});

app.get('/test/:sha', function(req, res, next) {
  var sha = req.params.sha;
  var repoURL = /*req.query.repo || */DEFAULT_REPO_URL;

  console.log("test started by:", req.connection.remoteAddress);
  console.log(repoURL, sha);

  // get the instance name, append a random number onto the end to help avoid
  // collisions
  var aws_instance_name = "testy-" + sha.substr(0, 7) + "-" + Math.floor(10000 * Math.random());

  // since multiple tests can be running at the same time, keep a small state
  // momento that we can use to keep track of which directory/instance to
  // remove when teardown occurs.
  var state = {
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
  // 6) update the ephemeral instance which cause the tests to run
  // 7) get the results
  // 8) delete the ephemeral instance
  // 9) remove the temporary directory
  res.writeHead(200, {
    'Content-Type': 'text/plain; charset=utf-8'
  });

  makeTempDir(aws_instance_name, function(err, dirPath) {
    if(checkErr(state, err, res)) return;

    sendUpdate(res, " >>> temporary directory created, cloning repo");

    state.dir_to_remove = dirPath;

    git.clone(dirPath, repoURL, function(err, r) {
      if(checkErr(state, err, res)) return;

      sendUpdate(res, " >>> successful clone of repo: " + repoURL + ", checking out code");

      git.checkout(dirPath, sha, "branch_to_test", function(err, r) {
        if(checkErr(state, err, res)) return;

        sendUpdate(res, " >>> checked out: " + sha + ", installing dependencies");

        git.install_deps(dirPath, "awsbox", function(err, r) {
          if(checkErr(state, err, res)) return;

          git.install_deps(dirPath, "temp", function(err, r) {
            if(checkErr(state, err, res)) return;

            sendUpdate(res, " >>> dependencies installed, creating AWS instance");

            deployer.create(dirPath, aws_instance_name, "c1.medium", function(err, r) {
              if(checkErr(state, err, res)) return;

              sendUpdate(res, " >>> AWS instance created, pushing code & running tests");
              state.instance_to_remove = aws_instance_name;

              deployer.update(dirPath, aws_instance_name, function(err, r) {
                if(checkErr(state, err, res)) return;

                sendUpdate(res, " >>> tests run, fetching results");
                deployer.getTestResults(dirPath, aws_instance_name, function(err, r) {
                  if(checkErr(state, err, res)) return;

                  sendUpdate(res, " >>> results fetched:");
                  res.write(r);
                  res.end();

                  teardown(state);
                });
              })
            });
          });
        });
      });
    });
  });
});

function makeTempDir(tempDirName, done) {
  var tempDirPath = path.join(__dirname, "var", tempDirName);

  var err = null;

  try {
    wrench.mkdirSyncRecursive(tempDirPath, 0777);
  } catch(e) {
    err = e;
  }

  done(err, tempDirPath);
}

var port = process.env['PORT'] || 3000;
app.listen(port, '127.0.0.1');
