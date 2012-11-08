/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


const vows        = require("vows"),
      assert      = require("assert"),
      git         = require("../lib/git"),
      SpawnMock   = require("./mocks/spawn").SpawnMock;

vows.describe("git").addBatch({
  'checkout': {
    topic: function() {
      this.spawnMock = new SpawnMock();
      git.init({
        spawn: this.spawnMock.spawn
      });
      git.checkout("test_directory", "test_sha", "test_branch", this.callback);
    },
    'completes successfully': function(exit_code) {
      assert.equal(this.spawnMock.lastProcess.cmd, "git");
      assert.equal(this.spawnMock.lastProcess.args[0], "checkout");
      assert.equal(this.spawnMock.lastProcess.opts.cwd, "test_directory");
      assert.equal(this.spawnMock.lastProcess.opts.env.GIT_WORK_TREE, "test_directory");
      assert.equal(this.spawnMock.lastProcess.opts.env.GIT_DIR, "test_directory/.git");
    }
  }
}).export(module);



