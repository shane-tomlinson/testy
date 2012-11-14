/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express         = require('express'),
      path            = require('path'),
      tests           = require('./lib/test-request-handler');

const DEFAULT_REPO_URL  = "git://github.com/mozilla/browserid.git";

// this is shared state that is shared with the test-request-handler and the
// views to keep track of which tests are currently being run.
var testsBeingRun = [];

var app = express();

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, "views"));

app.use(express.bodyParser())
   .use(express.static(path.join(__dirname, "..", "client")));


tests.init({
  testsBeingRun: testsBeingRun
}, function(err) {
  app.get('/', function(req, res, next) {
    res.render('index', {
      tests: testsBeingRun
    });
  });

  app.post('/test', function(req, res, next) {
    // start_test is called by a POST, so the sha/url are in the request.body
    var sha = req.body.sha;
    var repoURL = req.body.repo || DEFAULT_REPO_URL;

    tests.start_test(sha, repoURL, res);
  });

  app.get('/test', function(req, res, next) {
    // start_test is called by a GET, so the sha/url are in the request.query
    var sha = req.query.sha;
    var repoURL = req.query.repo || DEFAULT_REPO_URL;

    tests.get_test(sha, repoURL, res);
  });

  var port = process.env['PORT'] || 3000;
  app.listen(port, '127.0.0.1');
});

