/*
 * Copyright (C) 2014 Tim Cooper
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

var dgram = require('dgram');

var radius = require('radius');
var Zombie = require('zombie');

var OTP_LENGTH = 6;

/**
 * Authenticates user log in information.
 *
 * `username` - the user (without @domain)
 * `password` - the password for the user
 * `domain` - the user's domain
 * `otp` - the one time password for the user (optional)
 * `callback` - callback with signature: callback(err, obj)
 *  object `obj`
 *    string `username` - the username
 *    string `domain`   - the domain of the user
 *    boolean `status`  - true if accepted, false otherwise
 */
var authenticate;
module.exports.authenticate = authenticate = function(username, password, domain, otp, callback) {

  if (!callback && typeof otp === 'function') {
    callback = otp;
    otp = null;
  }

  try {
    var browser = new Zombie({
      maxRedirects: 20,
      runScripts: false,
      loadCSS: false
    });
    var finalize = function() {
      var authed = (browser.cookies.select({domain: 'google.com', name: 'SID'}).length > 0);
      browser.close();
      callback(null, {
        username: username,
        domain: domain,
        status: authed
      });
    };
    browser.visit('https://accounts.google.com/', function() {
      try {
        browser.fill('#Email', username + '@' + domain);
        browser.fill('#Passwd', password);
        browser.pressButton('#signIn', function() {
          if (!otp) {
            finalize();
          } else {
            browser.fill('#smsUserPin', otp);
            browser.pressButton('#smsVerifyPin', finalize);
          }
        });
      } catch (ex) {
        callback('Zombie error: ' + ex.toString());
      }
    });
  } catch (ex) {
    callback('Zombie error: ' + ex.toString());
  }
}

/**
 * Creates a datagram socket that handles RADIUS Access-Request messages.
 *
 * object `options`
 *  string `domain`   - the Google apps domain name
 *  string `secret`   - the radius secret
 *  string `protocol` - "udp4" (default) or "udp6"
 *
 * The additional events can be emitted by the returned socket object:
 *
 * "radius" - when authentication of a user has completed. The following object
 * will be passed with the event:
 *
 *  object `obj`
 *    string `username` - the username
 *    string `domain`   - the domain of the user
 *    boolean `status`  - true if accepted, false otherwise
 *
 * "radius-error" - when an error occurs decoding or parsing the RADIUS
 * packet. The following object will be passed with the event:
 *
 *  object `obj`
 *    string `domain`  - the domain the RADIUS server is authenticating on
 *    string `message` - the error description
 */
module.exports.createServer = function (options) {
  // Defaults
  if (!options) {
    options = {};
  }
  if (!options.protocol) {
    options.protocol = 'udp4';
  }

  // Create server
  var server = dgram.createSocket(options.protocol);

  // Register callback
  server.on('message', function (msg, rinfo) {
    try {
      var packet = radius.decode({
        packet: msg,
        secret: options.secret
      });
    } catch (ex) {
      server.emit('radius-error', {
        domain: options.domain,
        message: ex.toString()
      });
      return;
    }

    if (packet.code != 'Access-Request') {
      server.emit('radius-error', {
        domain: options.domain,
        message: 'Packet code error: not "Access-Request"'
      });
      return;
    }

    var username = packet.attributes['User-Name'];
    var password = packet.attributes['User-Password'];
    var otp = null;

    if (options.otp) {
      otp = password.slice(-OTP_LENGTH);
      password = password.slice(0, -OTP_LENGTH);
    }

    // Reply function
    authenticate(username, password, options.domain, otp, function (err, obj) {
      var code = !err && obj.status ? 'Access-Accept' : 'Access-Reject';
      var response = radius.encode_response({
        packet: packet,
        code: code,
        secret: options.secret
      });
      server.send(response, 0, response.length, rinfo.port, rinfo.address, function() {
        if (err) {
          obj = {
            username: username,
            domain: options.domain,
            status: false,
          };
        }
        server.emit('radius', obj);
      });
    });
  });

  return server;
};
