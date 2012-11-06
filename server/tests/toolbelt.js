
const vows        = require("vows"),
      assert      = require("assert"),
      toolbelt    = require("../lib/toolbelt");

vows.describe("copyExtendEnv").addBatch({
  'with no arguments': {
    topic: function() {
      return toolbelt.copyExtendEnv();
    },
    'we get the current environment': function(topic) {
      assert.deepEqual(topic, process.env);
    }
  },

  'with arguments': {
    topic: function() {
      return toolbelt.copyExtendEnv({
        EXTRA_FIELD: "value",
        SECOND_EXTRA_FIELD: "different_value"
      });
    },
    'adds extra parameters to environment': function(topic) {
      assert.equal(topic.EXTRA_FIELD, "value");
      assert.equal(topic.SECOND_EXTRA_FIELD, "different_value");
    }
  }
}).export(module);



