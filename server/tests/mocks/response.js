/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const EventEmitter    = require("events").EventEmitter,
      toolbelt        = require("../../lib/toolbelt");

var ResponseMock = function(done) {
  this.done = done;
};

ResponseMock.prototype = new EventEmitter();

toolbelt.extend(ResponseMock.prototype, {
  send: function(status, body) {
    if (!body) {
      body = status;
      status = 200;
    }

    this.body = body;
    this.status = status;

    this.done && this.done(null, body);
    this.emit("send", body);
  },

  json: function(status, body) {
    if (!body) {
      body = status;
      status = 200;
    }

    this.send(status, JSON.stringify(body));
    this.emit("json", body);
  },

  write: function(msg) {
    this.buf = this.buf || "";
    this.buf += (msg || "");

    this.status = this.status || 200;
    this.emit("write", null, this.buf);
  },

  end: function(msg) {
    this.buf = this.buf || "";
    this.buf += (msg || "");

    this.done && this.done(null, this.buf);
    this.emit("end", null, this.buf);
  }
});

module.exports = ResponseMock;

