/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


const vows        = require("vows"),
      assert      = require("assert"),
      deployer    = require("../lib/deployer"),
      ExecMock    = require("./mocks/exec").ExecMock,
      SpawnMock   = require("./mocks/spawn").SpawnMock;

vows.describe("deployer").addBatch({
  "runTests": {
    topic: function() {
      this.execMock = new ExecMock();
      deployer.init({
        exec: this.execMock.exec
      });
      deployer.runTests("instance_name", this.callback);
    },

    "completes successfully": function(code) {
      assert.equal(this.execMock.lastProcess.cmd.indexOf("ssh"), 0);
      assert.ok(this.execMock.lastProcess.cmd.indexOf("instance_name.personatest.org") > 0);
      assert.ok(this.execMock.lastProcess.cmd.indexOf("post-update.js") > 0);
    }
  },

  "getTestResults": {
    topic: function() {
      this.execMock = new ExecMock();
      deployer.init({
        exec: this.execMock.exec
      });
      deployer.getTestResults("results_directory", "instance_name", this.callback);
    },

    "completes successfully": function(code) {
      assert.equal(this.execMock.lastProcess.cmd.indexOf("scp"), 0);
    }
  }
}).export(module);

