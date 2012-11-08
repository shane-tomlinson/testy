/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

exports.SpawnMock = function() {
  var self = this;

  self.spawn = function(cmd, args, opts, cb) {
    self.lastProcess = {
      cmd: cmd,
      args: args,
      opts: opts,
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
    return self.lastProcess;
  };
};

