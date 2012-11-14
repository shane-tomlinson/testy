/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

var ResponseMock = function(done) {
  this.done = done;
};

ResponseMock.prototype = {
  send: function(status, body) {
    if (!body) {
      body = status;
      status = 200;
    }

    this.body = body;
    this.status = status;

    this.done(null, body);
  },

  json: function(status, body) {
    if (!body) {
      body = status;
      status = 200;
    }

    this.send(status, JSON.stringify(body));
  },

  write: function(msg) {
    this.buf = this.buf || "";
    this.buf += msg;
  },

  end: function(msg) {
    this.buf = this.buf || "";
    this.buf += msg;

    this.done(200, this.buf);
  }
};

module.exports = ResponseMock;

