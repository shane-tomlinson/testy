#!/usr/bin/env node

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var deployer = require('../deployer');

var dirPath = process.argv[2];
var sha = process.argv[3];

if (!(dirPath && sha)) {
  console.log("usage:", __filename, "<dir> <sha>");
  process.exit(1);
}


var aws_instance_name = "testy" + sha.substr(0, 8);
console.log('working dir', dirPath, "name", aws_instance_name);

/*deployer.create(dirPath, aws_instance_name, "c1.medium", function(err, r) {*/
  /*deployer.update(dirPath, aws_instance_name, function(err, r) {*/
    deployer.getTestResults(dirPath, aws_instance_name, function(err, r) {
      console.log(r);
    });
    /*
    deployer.destroy(dirPath, aws_instance_name, function(err, r) {
    });
    */
  /*});*/
/*});*/
