/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const vows        = require("vows"),
      path        = require("path"),
      assert      = require("assert"),
      results     = require("../lib/results");

results.init({
  results_dir: path.join(__dirname, "results_directory")
});

var suite = vows.describe("results");
suite.addBatch({
  'get_result with test set that has not been run': {
    topic: function() {
      results.get_result("not_found_sha", "test_repo_url", this.callback);
    },

    'returns results': function(results) {
      assert.equal(results.status, "not_found");
    }
  }
}).addBatch({
  'get_result with known done test set': {
    topic: function() {
      results.get_result("known_done_test_sha", "test_repo_url", this.callback);
    },

    'returns result': function(result) {
      assert.equal(result.status, "done");
      assert.equal(result.output, "these are the awesome results");
    }
  }
}).addBatch({
  'save_results': {
    topic: function() {
      results.save_result("new_test_sha", "test_repo_url", {
        status: "done",
        output: "Fantastic"
      }, this.callback);
    },

    'will save/overwrite a result': function(status) {
      assert.equal(status, true);
    },

    'allows saved result to be': {
      topic: function() {
        results.get_result("new_test_sha", "test_repo_url", this.callback);
      },

      'read.': function(result) {
        assert.equal(result.status, "done");
        assert.equal(result.output, "Fantastic");
      },

      'removed. Removed results are': {
        topic: function() {
          var cb = this.callback;

          results.delete_result("new_test_sha", "test_repo_url", function() {
            results.get_result("new_test_sha", "test_repo_url", cb);
          });
        },

        'no longer readable': function(results) {
          assert.equal(results.status, "not_found");
        }
      }
    }
  }
}).export(module);
