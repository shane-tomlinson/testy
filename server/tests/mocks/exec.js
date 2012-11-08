/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.ExecMock = function() {
  var self=this;

  self.exec = function(cmd, opts, cb) {
    self.lastProcess = {
      cmd: cmd,
      opts: opts,
      stdout: {
        pipe: function() {}
      },
      stderr: {
        pipe: function() {}
      }
    };

    // do this just after the return to simulate async behavior
    setTimeout(function() {
      cb(null, 0);
    }, 0);

    return self.lastProcess;
  };
};

