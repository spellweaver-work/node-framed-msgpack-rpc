// Generated by IcedCoffeeScript 1.6.2a
(function() {
  var Dispatch, Packetizer, Reponse, dbg, iced, __iced_k, __iced_k_noop,
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  __iced_k = __iced_k_noop = function() {};

  Packetizer = require('./packetizer').Packetizer;

  dbg = require('./debug');

  iced = require('./iced').runtime;

  exports.Reponse = Reponse = (function() {
    function Reponse(dispatch, seqid) {
      this.dispatch = dispatch;
      this.seqid = seqid;
      this.debug_msg = null;
    }

    Reponse.prototype.result = function(res) {
      if (this.debug_msg) {
        this.debug_msg.response(null, res).call();
      }
      return this.dispatch.respond(this.seqid, null, res);
    };

    Reponse.prototype.error = function(err) {
      if (this.debug_msg) {
        this.debug_msg.response(err, null).call();
      }
      return this.dispatch.respond(this.seqid, err, null);
    };

    return Reponse;

  })();

  exports.Dispatch = Dispatch = (function(_super) {
    __extends(Dispatch, _super);

    Dispatch.prototype.INVOKE = 0;

    Dispatch.prototype.RESPONSE = 1;

    Dispatch.prototype.NOTIFY = 2;

    function Dispatch() {
      this._invocations = {};
      this._handlers = {};
      this._seqid = 1;
      this._dbgr = null;
      Dispatch.__super__.constructor.apply(this, arguments);
    }

    Dispatch.prototype.set_debugger = function(d) {
      return this._dbgr = d;
    };

    Dispatch.prototype._dispatch = function(msg) {
      var error, method, param, response, result, seqid, type;
      if (!msg instanceof Array || msg.length < 2) {
        return this._warn("Bad input packet in dispatch");
      } else {
        switch ((type = msg.shift())) {
          case this.INVOKE:
            seqid = msg[0], method = msg[1], param = msg[2];
            response = new Reponse(this, seqid);
            return this._serve({
              method: method,
              param: param,
              response: response
            });
          case this.NOTIFY:
            method = msg[0], param = msg[1];
            return this._serve({
              method: method,
              param: param
            });
          case this.RESPONSE:
            seqid = msg[0], error = msg[1], result = msg[2];
            return this._dispatch_handle_response({
              seqid: seqid,
              error: error,
              result: result
            });
          default:
            return this._warn("Unknown message type: " + type);
        }
      }
    };

    Dispatch.prototype._dispatch_handle_response = function(_arg) {
      var error, result, seqid;
      seqid = _arg.seqid, error = _arg.error, result = _arg.result;
      return this._call_cb({
        seqid: seqid,
        error: error,
        result: result
      });
    };

    Dispatch.prototype._call_cb = function(_arg) {
      var cb, error, result, seqid;
      seqid = _arg.seqid, error = _arg.error, result = _arg.result;
      cb = this._invocations[seqid];
      if (cb) {
        delete this._invocations[seqid];
        return cb(error, result);
      }
    };

    Dispatch.prototype.cancel = function(seqid) {
      return this._call_cb({
        seqid: seqid,
        error: "cancelled",
        result: null
      });
    };

    Dispatch.prototype._next_seqid = function() {
      var ret;
      ret = this._seqid;
      this._seqid++;
      return ret;
    };

    Dispatch.prototype.make_method = function(prog, meth) {
      if (prog) {
        return [prog, meth].join(".");
      } else {
        return meth;
      }
    };

    Dispatch.prototype.respond = function(seqid, error, result) {
      var msg;
      msg = [this.RESPONSE, seqid, error, result];
      return this.send(msg);
    };

    Dispatch.prototype.invoke = function(_arg, cb, out) {
      var args, debug_msg, dtype, error, method, msg, notify, program, result, seqid, type, ___iced_passed_deferral, __iced_deferrals, __iced_k,
        _this = this;
      __iced_k = __iced_k_noop;
      ___iced_passed_deferral = iced.findDeferral(arguments);
      program = _arg.program, method = _arg.method, args = _arg.args, notify = _arg.notify;
      method = this.make_method(program, method);
      seqid = this._next_seqid();
      if (notify) {
        type = this.NOTIFY;
        dtype = dbg.constants.type.CLIENT_NOTIFY;
      } else {
        type = this.INVOKE;
        dtype = dbg.constants.type.CLIENT_INVOKE;
      }
      msg = [type, seqid, method, args];
      if (this._dbgr) {
        debug_msg = this._dbgr.new_message({
          method: method,
          seqid: seqid,
          arg: args,
          dir: dbg.constants.dir.OUTGOING,
          remote: this.remote_address(),
          port: this.remote_port(),
          type: dtype
        });
        debug_msg.call();
      }
      this.send(msg);
      (function(__iced_k) {
        if ((cb != null) || !notify) {
          if (out != null) {
            out.cancel = function() {
              return _this.cancel(seqid);
            };
          }
          (function(__iced_k) {
            __iced_deferrals = new iced.Deferrals(__iced_k, {
              parent: ___iced_passed_deferral,
              filename: "src/dispatch.iced",
              funcname: "Dispatch.invoke"
            });
            _this._invocations[seqid] = __iced_deferrals.defer({
              assign_fn: (function() {
                return function() {
                  error = arguments[0];
                  return result = arguments[1];
                };
              })(),
              lineno: 136
            });
            __iced_deferrals._fulfill();
          })(function() {
            return __iced_k(debug_msg ? debug_msg.response(error, result).call() : void 0);
          });
        } else {
          return __iced_k();
        }
      })(function() {
        if (cb) {
          return cb(error, result);
        }
      });
    };

    Dispatch.prototype._dispatch_reset = function() {
      var cb, inv, key, _results;
      inv = this._invocations;
      this._invocations = {};
      _results = [];
      for (key in inv) {
        cb = inv[key];
        _results.push(cb("EOF from server", {}));
      }
      return _results;
    };

    Dispatch.prototype._serve = function(_arg) {
      var debug_msg, method, pair, param, response;
      method = _arg.method, param = _arg.param, response = _arg.response;
      pair = this.get_handler_pair(method);
      if (this._dbgr) {
        debug_msg = this._dbgr.new_message({
          method: method,
          seqid: response.seqid,
          arg: param,
          dir: dbg.constants.dir.INCOMING,
          remote: this.remote_address(),
          port: this.remote_port(),
          type: dbg.constants.type.SERVER,
          error: pair ? null : "unknown method"
        });
        if (response) {
          response.debug_msg = debug_msg;
        }
        debug_msg.call();
      }
      if (pair) {
        return pair[1].call(pair[0], param, response, this);
      } else if (response != null) {
        return response.error("unknown method: " + method);
      }
    };

    Dispatch.prototype.get_handler_this = function(m) {
      return this;
    };

    Dispatch.prototype.get_handler_pair = function(m) {
      var h;
      h = this._handlers[m];
      if (h) {
        return [this.get_handler_this(m), h];
      } else {
        return null;
      }
    };

    Dispatch.prototype.add_handler = function(method, hook, program) {
      if (program == null) {
        program = null;
      }
      method = this.make_method(program, method);
      return this._handlers[method] = hook;
    };

    Dispatch.prototype.add_program = function(program, hooks) {
      var hook, method, _results;
      _results = [];
      for (method in hooks) {
        hook = hooks[method];
        _results.push(this.add_handler(method, hook, program));
      }
      return _results;
    };

    Dispatch.prototype.add_programs = function(programs) {
      var hooks, program, _results;
      _results = [];
      for (program in programs) {
        hooks = programs[program];
        _results.push(this.add_program(program, hooks));
      }
      return _results;
    };

    return Dispatch;

  })(Packetizer);

}).call(this);