
const vows        = require("vows"),
      assert      = require("assert"),
      git         = require("../lib/git");

var SpawnMock = function(cmd, args, opts, cb) {
  SpawnMock.cmd = cmd;
  SpawnMock.args = args;
  SpawnMock.opts = opts;

  return {
    stdout: {
      pipe: function() {}
    },
    stderr: {
      pipe: function() {}
    },
    on: function(msg, msgcb) {
      if (msg === "exit") {
        msgcb && msgcb(0);
      }
    }
  };
};

vows.describe("git").addBatch({
  'checkout': {
    topic: function() {
      git.init({ spawn: SpawnMock });
      git.checkout("test_directory", "test_sha", "test_branch", this.callback);
    },
    'completes successfully': function(exit_code) {
      assert.equal(SpawnMock.cmd, "git");
      assert.equal(SpawnMock.args[0], "checkout");
      assert.equal(SpawnMock.opts.cwd, "test_directory");
      assert.equal(SpawnMock.opts.env.GIT_WORK_TREE, "test_directory");
      assert.equal(SpawnMock.opts.env.GIT_DIR, "test_directory/.git");
    }
  }
}).export(module);



