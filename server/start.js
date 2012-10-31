/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const express         = require('express'),
      path            = require('path'),
      fs              = require('fs'),
      temp            = require('temp'),
      git             = require('./git'),
      deployer        = require('./deployer');

/*const repoURL = "git://github.com/mozilla/browserid.git"*/
const repoURL = "file://192.168.1.88/Users/stomlinson/development/browserid";

var app = express();

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, "views"));

app.use(express.bodyParser())
   .use(express.cookieParser())
   .use(express.session({
     secret: 'mysecret'
   }))
   .use(express.static(path.join(__dirname, "..", "client")));

app.get('/:sha', function(req, res, next) {
  var sha = req.params.sha;
  console.log(sha);

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
  temp.mkdir(null, function(err, dirPath) {
    git.clone(dirPath, repoURL, function(err, r) {
      git.checkout(dirPath, sha, function(err, r) {
        git.install_deps(dirPath, function(err, r) {
          var aws_instance_name = "tester-" + sha.substr(0, 8);
          deployer.create(dirPath, aws_instance_name, "c1.medium", function(err, r) {
            deployer.update(dirPath, aws_instance_name, function(err, r) {
              deployer.destroy(dirPath, aws_instance_name, function(err, r) {
                fs.rmdir(dirPath, function(err, r) {
                  res.send(200, req.param.sha);
                });
              });
            })
          });
        });
      });
    });
  });
});

app.listen(3000);
