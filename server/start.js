/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express         = require('express'),
      path            = require('path'),
      test_runner     = require('./lib/test-runner');

var testsBeingRun = [];

var app = express();

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, "views"));

app.use(express.bodyParser())
   .use(express.static(path.join(__dirname, "..", "client")));

app.get('/', function(req, res, next) {
  res.render('index', {
    tests: testsBeingRun
  });
});

app.post('/test', test_runner.setup({
  tests: testsBeingRun
}));

var port = process.env['PORT'] || 3000;
app.listen(port, '127.0.0.1');
