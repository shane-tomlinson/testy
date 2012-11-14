/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */


const vows          = require("vows"),
      assert        = require("assert"),
      path          = require("path"),
      tests         = require("../lib/test-request-handler"),
      results       = require("../lib/results"),
      Response      = require("./mocks/response"),
      git_mock      = require("./mocks/git"),
      deployer_mock = require("./mocks/deployer");

results.init({
  results_dir: path.join(__dirname, "results_directory")
});

tests.init({
  testsBeingRun: [],
  git: git_mock,
  deployer: deployer_mock
});

var suite = vows.describe("test-request-handler");
suite.addBatch({
  'get_test with known ready test': {
    topic: function() {
      this.responseMock = new Response(this.callback);

      tests.get_test({
        body: {
          sha: "known_done_test_sha",
          repo: "test_repo_url"
        }
      }, this.responseMock, function() {});
    },

    'returns the results': function(results) {
      assert.equal("these are the awesome results", results);
    }
  }
}).addBatch({
  'get_test with known pending test': {
    topic: function() {
      this.responseMock = new Response(this.callback);

      tests.get_test({
        body: {
          sha: "known_pending_test_sha",
          repo: "test_repo_url"
        }
      }, this.responseMock, function() {});
    },

    'returns the results': function(results) {
      assert.equal("these are partial results", results);
    }
  }
}).addBatch({
  'start_test kicks off a series of tests and': {
    topic: function() {
      this.responseMock = new Response(this.callback);

      tests.start_test({
        body: {
          sha: "unknown_test_sha",
          repo: "test_repo_url"
        }
      }, this.responseMock, function() {});
    },

    'returns a 200 with the results': function(code, results) {
      assert.equal(200, code);
      assert.ok(results);
    }
  }
}).addBatch({
  'after start_test has completed, results.get_result': {
    topic: function() {
      var cb = this.callback;
      var responseMock = new Response(function(code, test_results) {
        results.get_result("unknown_test_sha_2", "test_repo_url", cb);
      });

      tests.start_test({
        body: {
          sha: "unknown_test_sha_2",
          repo: "test_repo_url"
        }
      }, responseMock, function() {});
    },

    'gets the results for the test': function(err, result) {
      assert.equal('done', result.status);
      assert.ok(result.output);
    }
  }
}).export(module);

