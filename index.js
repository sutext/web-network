Object.defineProperty(exports, "__esModule", { value: true });

var __extends =
    globalThis.__extends ||
    (function () {
        var extendStatics = function (d, b) {
            extendStatics =
                Object.setPrototypeOf ||
                ({ __proto__: [] } instanceof Array &&
                    function (d, b) {
                        d.__proto__ = b;
                    }) ||
                function (d, b) {
                    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
                };
            return extendStatics(d, b);
        };
        return function (d, b) {
            extendStatics(d, b);
            function __() {
                this.constructor = d;
            }
            d.prototype =
                b === null
                    ? Object.create(b)
                    : ((__.prototype = b.prototype), new __());
        };
    })();
globalThis.__extends = __extends;

var HTTPError = /** @class */ (function () {
    function HTTPError(type, status, info) {
        this.type = type;
        this.status = status;
        this.info = info;
    }
    HTTPError.abort = function (status) {
        return new HTTPError("abort", status, "The request has been abort!");
    };
    HTTPError.timeout = function (status) {
        return new HTTPError("timeout", status, "Request timeout!");
    };
    HTTPError.service = function (status, info) {
        return new HTTPError("service", status, info);
    };
    Object.defineProperty(HTTPError.prototype, "message", {
        get: function () {
            return this.info && this.info.message;
        },
        enumerable: true,
        configurable: true,
    });
    return HTTPError;
})();

var DataTask = /** @class */ (function () {
    function DataTask(promiss, handler) {
        this.promiss = promiss;
        this.handler = handler;
        this[Symbol.toStringTag] = "Promise";
        var _this = this;
        this.then = function (onfulfilled, onrejected) {
            return _this.promiss.then(onfulfilled, onrejected);
        };
        this.catch = function (onrejected) {
            return _this.promiss.catch(onrejected);
        };
        this.abort = function () {
            _this.handler.abort();
        };
        this.onProgress = function (func) {
            _this.handler.onprogress = func;
        };
    }
    return DataTask;
})();

var UploadTask = /** @class */ (function (_super) {
    __extends(UploadTask, _super);
    function UploadTask() {
        var _this = (_super !== null && _super.apply(this, arguments)) || this;
        _this.onProgress = function (func) {
            _this.handler.upload.onprogress = func;
        };
        return _this;
    }
    return UploadTask;
})(DataTask);

function isPlanValue(value) {
    var type = typeof value;
    switch (type) {
        case "bigint":
        case "string":
        case "number":
        case "boolean":
            return true;
        default:
            return false;
    }
}
function encodeValue(url, key, value) {
    if (isPlanValue(value)) {
        url = url + "&" + key + "=" + value;
    } else if (Array.isArray(value)) {
        for (var index = 0; index < value.length; index++) {
            if (isPlanValue(value[index])) {
                url = url + "&" + key + "=" + value[index];
            }
        }
    }
    return url;
}
function encodeParams(params) {
    if (!params) return "";
    var keys = Object.keys(params);
    if (keys.length === 0) return "";
    var url = encodeValue("", keys[0], params[keys[0]]);
    for (var index = 1; index < keys.length; index++) {
        var key = keys[index];
        var value = params[key];
        url = encodeValue(url, key, value);
    }
    return "?" + url.substring(1);
}
function replaceImpl(impl) {
    if (typeof impl !== "object") {
        throw new Error("invalid Network implementation");
    }
    if (typeof impl.request !== "function") {
        throw new Error("invalid Network implementation");
    }
    Network.impl = impl;
}
var Network = (function () {
    function Network() {
        var _this = this;
        this.upload = function (path, upload) {
            var opts = upload.opts || {};
            opts.headers = Object.assign(_this.headers, opts.headers);
            opts.headers.method = "POST";
            var options = Object.assign(_this.options, opts);
            if (!_this.before(path, options)) return;
            var data = new FormData();
            var params = _this.params(upload.params);
            data.append(upload.name, upload.data);
            if (params) {
                for (var key in params) {
                    data.append(key, params[key]);
                }
            }
            var values = Network.post(_this.url(path), data, options);
            var promiss = new Promise(function (resolve, reject) {
                values[0]
                    .then(function (json) {
                        var parser =
                            (options && options.parser) ||
                            _this.resolve.bind(_this);
                        var value = parser(json);
                        return value;
                    })
                    .then(function (obj) {
                        resolve(obj);
                        _this.after(path, obj);
                    })
                    .catch(function (e) {
                        reject(e);
                        _this.after(path, e);
                    });
            });
            return new UploadTask(promiss, values[1]);
        };
        this.anyreq = function (req) {
            return _this.anytask(req.path, req.data, req.opts);
        };
        this.objreq = function (req) {
            if (typeof req.meta !== "function")
                throw new Error("the meta of objreq must be a Constructor");
            return _this.objtask(req.meta, req.path, req.data, req.opts);
        };
        this.aryreq = function (req) {
            if (typeof req.meta !== "function")
                throw new Error("the meta of aryreq must be a Constructor");
            return _this.arytask(req.meta, req.path, req.data, req.opts);
        };
        this.mapreq = function (req) {
            if (typeof req.meta !== "function")
                throw new Error("the meta of mapreq must be a Constructor");
            return _this.maptask(req.meta, req.path, req.data, req.opts);
        };
        this.anytask = function (path, data, opts) {
            opts = opts || {};
            opts.headers = Object.assign(_this.headers, opts.headers);
            var options = Object.assign(_this.options, opts);
            if (!_this.before(path, opts)) return;
            var values = Network.http(
                _this.url(path),
                _this.params(data),
                options
            );
            var promiss = new Promise(function (resolve, reject) {
                values[0]
                    .then(function (json) {
                        var parser =
                            (options && options.parser) ||
                            _this.resolve.bind(_this);
                        var value = parser(json);
                        return value;
                    })
                    .then(function (obj) {
                        resolve(obj);
                        _this.after(path, obj);
                    })
                    .catch(function (e) {
                        try {
                            _this.reject(e);
                        } catch (error) {
                            reject(error);
                        }
                        _this.after(path, e);
                    });
            });
            return new DataTask(promiss, values[1]);
        };
        this.objtask = function (meta, path, data, opts) {
            opts = opts || {};
            opts.headers = Object.assign(_this.headers, opts.headers);
            var options = Object.assign(_this.options, opts);
            if (!_this.before(path, opts)) return;
            var values = Network.http(
                _this.url(path),
                _this.params(data),
                options
            );
            var promiss = new Promise(function (resolve, reject) {
                values[0]
                    .then(function (json) {
                        var parser =
                            (options && options.parser) ||
                            _this.resolve.bind(_this);
                        return parser(json);
                    })
                    .then(function (value) {
                        return new meta(value);
                    })
                    .then(function (obj) {
                        resolve(obj);
                        _this.after(path, obj);
                    })
                    .catch(function (e) {
                        try {
                            _this.reject(e);
                        } catch (error) {
                            reject(error);
                        }
                        _this.after(path, e);
                    });
            });
            return new DataTask(promiss, values[1]);
        };
        this.arytask = function (meta, path, data, opts) {
            opts = opts || {};
            opts.headers = Object.assign(_this.headers, opts.headers);
            var options = Object.assign(_this.options, opts);
            if (!_this.before(path, options)) return;
            var values = Network.http(
                _this.url(path),
                _this.params(data),
                options
            );
            var promiss = new Promise(function (resolve, reject) {
                values[0]
                    .then(function (json) {
                        var parser =
                            (options && options.parser) ||
                            _this.resolve.bind(_this);
                        return parser(json);
                    })
                    .then(function (value) {
                        return Array.isArray(value)
                            ? value.map(function (ele) {
                                  return new meta(ele);
                              })
                            : [];
                    })
                    .then(function (ary) {
                        resolve(ary);
                        _this.after(path, ary);
                    })
                    .catch(function (e) {
                        try {
                            _this.reject(e);
                        } catch (error) {
                            reject(error);
                        }
                        _this.after(path, e);
                    });
            });
            return new DataTask(promiss, values[1]);
        };
        this.maptask = function (meta, path, data, opts) {
            opts = opts || {};
            opts.headers = Object.assign(_this.headers, opts.headers);
            var options = Object.assign(_this.options, opts);
            if (!_this.before(path, options)) return;
            var values = Network.http(
                _this.url(path),
                _this.params(data),
                options
            );
            var promiss = new Promise(function (resolve, reject) {
                values[0]
                    .then(function (json) {
                        var parser =
                            (options && options.parser) ||
                            _this.resolve.bind(_this);
                        return parser(json);
                    })
                    .then(function (value) {
                        var result = {};
                        var mapkey = (opts && opts.mapkey) || "id";
                        if (Array.isArray(value)) {
                            value.forEach(function (ele) {
                                var obj = new meta(ele);
                                var keyvalue = obj[mapkey];
                                if (keyvalue) {
                                    result[keyvalue] = obj;
                                } else {
                                    console.warn(
                                        "the mapkey:",
                                        mapkey,
                                        "not exist in object:",
                                        obj
                                    );
                                }
                            });
                        } else if (typeof value === "object") {
                            for (var key in value) {
                                var obj = new meta(value[key]);
                                var keyvalue = obj[mapkey];
                                if (keyvalue) {
                                    result[keyvalue] = obj;
                                } else {
                                    console.warn(
                                        "the mapkey:",
                                        mapkey,
                                        "not exist in object:",
                                        obj
                                    );
                                }
                            }
                        }
                        return result;
                    })
                    .then(function (map) {
                        resolve(map);
                        _this.after(path, map);
                    })
                    .catch(function (e) {
                        try {
                            _this.reject(e);
                        } catch (error) {
                            reject(error);
                        }
                        _this.after(path, e);
                    });
            });
            return new DataTask(promiss, values[1]);
        };
    }
    Object.defineProperty(Network.prototype, "options", {
        get: function () {
            return {
                method: this.method,
                mapkey: this.mapkey,
                timeout: this.timeout,
                restype: this.restype,
                loading: this.loading,
            };
        },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(Network.prototype, "headers", {
        get: function () {
            return {};
        },
        enumerable: true,
        configurable: true,
    });
    Object.defineProperty(Network.prototype, "method", {
        get: function () {
            return "POST";
        },
        enumerable: true,
        configurable: true,
    });
    Network.prototype.url = function (path) {
        throw new Error("Network.url(path:string) must be implement");
    };
    Network.prototype.resolve = function (json) {
        return json;
    };
    Network.prototype.reject = function (error) {
        throw error;
    };
    Network.prototype.params = function (data) {
        return data;
    };
    Network.prototype.before = function () {
        return true;
    };
    Network.prototype.after = function () {};
    return Network;
})();

(function (Network) {
    Network.http = function (url, data, opts) {
        if (Network.impl) {
            return Network.impl.request(url, data, opts);
        }
        return (opts && opts.method) === "GET"
            ? Network.get(url, data, opts)
            : Network.post(url, data, opts);
    };
    Network.get = function (url, data, opts) {
        var handler;
        var promiss = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            handler = xhr;
            xhr.onabort = function () {
                return reject(Network.Error.abort(xhr.status));
            };
            xhr.ontimeout = function () {
                return reject(Network.Error.timeout(xhr.status));
            };
            xhr.onerror = function (e) {
                return reject(Network.Error.service(xhr.status, e));
            };
            xhr.onloadend = function () {
                var data =
                    xhr.responseType === "json"
                        ? xhr.response
                        : xhr.responseText;
                if (
                    (xhr.status >= 200 && xhr.status < 300) ||
                    xhr.status === 304
                ) {
                    resolve(data);
                } else {
                    reject(Error.service(xhr.status, data));
                }
            };
            url = url + encodeParams(data);
            xhr.open("GET", url, true);
            xhr.timeout = (opts && opts.timeout) || 0;
            xhr.responseType = (opts && opts.restype) || "json";
            var headers = (opts && opts.headers) || {};
            for (var key in headers) {
                xhr.setRequestHeader(key, headers[key]);
            }
            xhr.send();
        });
        return [promiss, handler];
    };
    var _reqidx = 0;
    Network.post = function (url, data, opts) {
        var handler;
        var promiss = new Promise(function (resolve, reject) {
            var xhr = new XMLHttpRequest();
            handler = xhr;
            xhr.onabort = function () {
                return reject(Network.Error.abort(xhr.status));
            };
            xhr.ontimeout = function () {
                return reject(Network.Error.timeout(xhr.status));
            };
            xhr.onerror = function (e) {
                return reject(Network.Error.service(xhr.status, e));
            };
            xhr.onloadend = function () {
                var data =
                    xhr.responseType === "json"
                        ? xhr.response
                        : xhr.responseText;
                if (
                    (xhr.status >= 200 && xhr.status < 300) ||
                    xhr.status === 304
                ) {
                    resolve(data);
                } else {
                    reject(Error.service(xhr.status, data));
                }
            };
            xhr.open(opts.method, url, true);
            xhr.timeout = (opts && opts.timeout) || 0;
            xhr.responseType = (opts && opts.restype) || "json";
            var headers = (opts && opts.headers) || {};
            for (var key in headers) {
                xhr.setRequestHeader(key, headers[key]);
            }
            if (data instanceof FormData) {
                xhr.send(data);
            } else {
                if (!headers["Content-Type"]) {
                    xhr.setRequestHeader("Content-Type", "application/json");
                }
                var body = data || {};
                body._reqidx = _reqidx++;
                xhr.send(JSON.stringify(body));
            }
        });
        return [promiss, handler];
    };
})(Network);

module.exports.default = Network;
module.exports.HTTPError = HTTPError;
module.exports.DataTask = DataTask;
module.exports.UploadTask = UploadTask;
module.exports.encodeParams = encodeParams;
module.exports.replaceImpl = replaceImpl;
