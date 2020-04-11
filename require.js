void function init() {
  "use strict";
  var win = window, req = win.require;
  if (req && req.ACDM) {
    return;
  }
  var OBJ = Object, doc = document, script = doc.getElementById('ACDM-DST') || doc.currentScript,
    UNDEFINED = undefined,NULL=null,FALSE=false,TRUE=true,CONSOLE=console;
  var hasOwn = OBJ.prototype.hasOwnProperty, assign = OBJ.assign, isArray = Array.isArray;//, arrayConcat = Array.prototype.concat
  var base = doc.createElement('base');
  var mainPath, currentPath, pageBasePath = getPageBasePath();//promisePath,scriptPath
  if (!script) {
    doc.querySelectorAll('script').forEach(function (_require) {
      if (_require.src.search(/[/\\]require(\.min)*.js/i) > -1) {
        script = _require;
      }
    })
  }
  if (script) {
    var pageBaseDir = toDir(pageBasePath);
    var dataset = script.dataset;
    /*scriptPath = script.src;
    promisePath = dataset.promise;
    if (promisePath) {
      promisePath = toAbsJsPath(promisePath, pageBaseDir)
    } else {
      promisePath = toAbsJsPath('./promise.js', toDir(scriptPath))
    }*/
    mainPath = dataset.main;
    if (mainPath) {
      mainPath = toAbsJsPath(mainPath, pageBaseDir)
    }
  }
  currentPath = mainPath || pageBasePath;
  var currentBaseUrl = toDir(currentPath);
  /*if (!window.Promise && promisePath) {
    includeScript(promisePath, function (isLoad) {
      if (isLoad) {
        init();
      }
    });
    return;
  }*/

  var head = doc.head || doc.getElementsByTagName('head')[0];

  function getPageBasePath() {
    return toOriginUrl(doc.baseURI);
  }

  function toOriginUrl(url) {
    return (url || '').replace(/(\?[\s\S]*|#[\s\S]*)$/, '')
  }

  function toNoHashUrl(url) {
    return url.replace(/#[\s\S]*$/, '')
  }

  function toJsPath(path) {
    path = path.trim();
    return (/\.min$/.test(path) || !/^\s*([a-zA-z]+:)*[/\\]{2}|\.[^/\\]+$|\?/.test(path) ? path + '.js' : path)
  }

  function toDir(path) {
    path = toOriginUrl(path);
    path = path + (/[/\\]$/.test(path) ? '' : '/') + (/\.[^/\\]+$/.test(path) ? '../' : './');
    return toAbsUrl(path);
  }

  function toLowerCaseUrl(url) {
    var index = url.indexOf('?');
    return index !== -1 ? url.slice(0, index).toLowerCase() + url.slice(index) : url.toLowerCase()
  }

  function isAbsUrl(url) {
    return /^\s*([a-zA-z]+:)*[/\\]{2}[^./\\]/.test(url)
  }

  /*
    function hasProtocol() {
      return /^\s*([a-zA-z]+:)[/\\]{2}[^./\\]/.test(url)
    }
  */

  function toAbsPath(path, currentDir) {
    path = toLowerCaseUrl(path);
    return toAbsUrl(isAbsUrl(path) ? path : currentDir + path).trim().replace(/([^:])[/\\]{2,}/, '$1/');
  }

  function toAbsUrl(url) {
    base.href = isAbsUrl(url) ? url : getPageBasePath() + url;
    return base.href;
  }

  function toAbsJsPath(path, currentDir) {
    return toAbsPath(toJsPath(toNoHashUrl(path)), currentDir)
  }


  var mrId =
      Math.floor(Math.random() * 1e5).toString(36),
    syncsName = 'sync_' + mrId,
    syncsOptionName = 'syncOption_' + mrId,
    exportName = 'export_' + mrId, exportGenerated = 'exportG_' + mrId,
    //modulePathId = 'modulePath_' + mrId,
    moduleNameId = 'moduleName_' + mrId,
    currentDirName = 'currentDir_' + mrId,
    baseUrlDirName = 'baseDir_' + mrId,
    baseUrlUrlCopy = 'baseUrlCopy_' + mrId,
    isLock = 'isLock_' + mrId;

  var globalConfig = {
    timeout: 20e3,
    baseUrl: currentBaseUrl,
    alias: {}
  }, exportsCache = {};

  function getConfig() {
    return globalConfig
  }

  function getBaseUrl() {
    var baseUrl = globalConfig.baseUrl;
    if (globalConfig[baseUrlUrlCopy] !== baseUrl) {
      globalConfig[baseUrlUrlCopy] = baseUrl;
      return globalConfig[baseUrlDirName] = toDir(baseUrl)
    }
    return globalConfig[baseUrlDirName] || ''
  }

  function setConfig(config) {
    assign(globalConfig, config)
  }


  function getModuleInfo(path, currentDir, callback) {
    var alias = globalConfig.alias[path = path.replace(/^@/, '')], deps, params;
    if (alias) {
      var baseUrl = getBaseUrl();
      if (isObject(alias)) {
        deps = alias.deps;
        path = alias.path;
        params = alias.params;
      } else {
        path = alias;
      }
      if (!deps && path[0] === '@') {
        return getModuleInfo(path, baseUrl, callback)
      }
    }
    var notCache = isNotCachePath(path), canCache = !notCache;
    return {
      params: params,
      notCache: notCache,
      canCache: canCache,
      deps: deps,
      module: canCache && callback !== UNDEFINED && getExportsCacheCall(toNoHashUrl(path), callback),
      originalPath: path,
      path: toAbsJsPath(path, currentDir)
    }
  }

  function getModuleAbsPath(path, currentDir) {
    var alias = globalConfig.alias[path = path.replace(/^@/, '')];
    if (alias) {
      var baseUrl = getBaseUrl(), deps;
      if (isObject(alias)) {
        deps = alias.deps;
        path = alias.path;
      } else {
        path = alias;
      }
      if (!deps && path[0] === '@') {
        return getModuleAbsPath(path, baseUrl)
      }
    }
    return toAbsJsPath(path, currentDir)
  }

  function removeModule(path, isId, dir) {
    tryDelete(exportsCache, isId ? path : getModuleAbsPath(path, dir))
  }

  function clear() {
    exportsCache = {};
  }


  function cacheModule(id, value, isUpdate) {
    if (id && (isUpdate || !exportsCache[id])) {
      exportsCache[id] = {value: value};
    }
  }


  function cacheExports(module, id) {
    var exports = module[exportName], isPublic = module === publicModule;
    if (exports !== module[exportGenerated] || nonEmptyObj(exports)) {
      cacheModule(id, exports);
    } else if (isPublic) {
      cacheModule(id, exports);
    }
    if (isPublic) {
      initExports(publicModule);
    }
  }

  function isEmptyModule(module) {
    var exports = module[exportName];
    return exports === module[exportGenerated] && !nonEmptyObj(exports)
  }

  function setExports(module, exports, id) {
    if (!module[isLock]) {
      module[isLock] = TRUE;
      module[exportName] = exports;
      module.exportGenerated = NaN;
      cacheModule(id, exports);
    }
  }

  function initExports(module) {
    module[isLock] = FALSE;
    module[exportName] = module[exportGenerated] = {}
  }

  function hasModule(id) {
    return exportsCache.hasOwnProperty(id) && !!exportsCache[id];
  }

  function PrivateModule(path, id, dir) {
    //this[modulePathId] = path;
    this[moduleNameId] = id || path;
    this[currentDirName] = dir;
    initExports(this);
  }

  PrivateModule.prototype = {
    getConfig: getConfig,
    setConfig: setConfig,
    getCurrentDir: function () {
      return this[currentDirName]
    },
    get id() {
      return this[moduleNameId];
    },
    has: hasModule,
    exist: function () {
      return hasModule(this[moduleNameId]);
    },
    remove: function (path, isId) {
      var isSelf = path === UNDEFINED;
      removeModule(isSelf ? this[moduleNameId] : path, isSelf || isId, this[currentDirName]);
      if (this[isLock]) {
        this[isLock] = !isSelf;
      }
    },
    removeById: function (id) {
      removeModule(id, id);
      if (this[isLock]) {
        this[isLock] = this[moduleNameId] !== id;
      }
    },
    clear: function () {
      clear();
      this[isLock] = FALSE;
    },
    get: function (id) {
      return getExportsCacheValue(id === UNDEFINED ? this[moduleNameId] : id)
    },
    get exports() {
      return this[exportName];
    },
    set exports(value) {
      setExports(this, value, this[moduleNameId])
    }
  };

  function PublicModule() {
    initExports(this);
    this[syncsName] = []
  }


  PublicModule.prototype = {
    getConfig: getConfig,
    setConfig: setConfig,
    update: function (id, value) {
      cacheModule(id, value, 1)
    },
    has: hasModule,
    remove: function (path, isId) {
      removeModule(path, isId, getBaseUrl())
    },
    removeById: function (id) {
      removeModule(id, id)
    },
    get: getExportsCacheValue,
    getCurrentDir: getBaseUrl,
    clear: clear,
    /**
     * @typedef {function(require:window.require,...*):*} syncsFn
     * @typedef {{name?:string,require?:*,define?:syncsFn,depMap?:{params?:Object,deps?:Array}|Array}} syncsObject
     * @typedef {Array<syncsFn>|Array<syncsObject>} syncsArray
     * @typedef {syncsFn|syncsObject|syncsArray|*} syncsType
     * @return {syncsFn}
     */
    get syncs() {
      return this[syncsName]
    },
    /**
     *
     * @param {syncsType} syncsVale
     */
    set syncs(syncsVale) {
      setSyncs(this, syncsVale);
    },
    get exports() {
      return this[exportName];
    },
    /**
     * @alias exports
     * @type Object
     */
    set exports(value) {
      setExports(this, value);
    },
    plugins: {}
  };


  function nonEmptyObj(o) {
    if (isObject(o)) {
      for (var k in o) {
        if (hasOwn.call(o, k)) {
          return TRUE
        }
      }
    }
  }


  function syncsModule(notCache, currentPath, callback) {
    var syncs = publicModule[syncsName];
    syncs = isArray(syncs) ? syncs : [syncs];
    publicModule[syncsOptionName] = UNDEFINED;
    publicModule[syncsName] = [];
    var currentDir = toDir(currentPath);
    var mod, err, privateRequires = [], privateModules = [], length = syncs.length;
    var eachCallback = function (index, ret) {
      if (index === 0) {
        mod = ret.module;
        if (ret.state) {
          err = ret;
        }
      }
      if (--length <= 0) {
        callback(mod, err)
      }
    };
    for (var i = 0, l = length; i < l; i++) {
      execSyncs(notCache, syncs[i], currentDir, currentPath, privateRequires, privateModules, i, eachCallback)
    }
  }

  /*  function noop() {

    }*/

  function createPrivateRequire(dir) {
    return function require(paths, deps, then, error) {
      return requireMain(dir, paths, deps, then, error)
    }
  }

  function isObject(o) {
    return o && typeof o === "object"
  }

  /**
   * @typedef {function(...[],require:window.require):*} defineFn
   * @param {string|Array|defineFn|*} name
   * @param {defineFn|string|Array|Object|*} [des]
   * @param {defineFn|Object|*} [defineFn]
   * @param {Object|*} [desMap]
   */
  window.define = function define(name, des, defineFn, desMap) {
    if (isArray(name)) {
      desMap = defineFn;
      defineFn = des;
      des = name;
      name = UNDEFINED;
    } else if (isFunc(name)) {
      desMap = defineFn;
      defineFn = name;
      des = name = UNDEFINED;
    }
    if (isFunc(des)) {
      desMap = defineFn;
      defineFn = des;
      des = UNDEFINED;
    }
    module.syncs = {
      methodName: 'define',
      name: name,
      desMap: desMap,
      require: des,
      define: defineFn
    };
  };

  /*
    /!**
     *
     * @param args
     * @return {Window}
     *!/
    function getMR(args) {
      var length = args.length;
      return {
        module: args[length - 2],
        require: args[length - 1]
      }
    }

    /!**
     *
     * @param args
     * @return window.module
     *!/
    function getM(args) {
      return args[length - 2]
    }

    /!**
     * @param args
     * @return window.require
     *!/
    function getR(args) {
      return args[length - 1]
    }*/

  function execSyncs(notCache, syncs, currentDir, currentPath, privateRequires, privateModules, index, execCallback) {
    var _require, _define, _depMap, name, privateModule, privateRequire, isDefineMethod, isSame;
    if (isObject(syncs)) {
      isDefineMethod = syncs.methodName === 'define';
      _require = syncs.require;
      _depMap = syncs.depMap;
      _define = syncs.define;
      name = syncs.name;
    } else {
      _define = syncs;
    }
    for (var j = 0, len = privateModules.length; j < len; j++) {
      privateModule = privateModules[j];
      privateRequire = privateRequires[j];
      if ((isSame = privateModule && privateModule[moduleNameId] === name)) {
        break;
      }
    }

    if (!isSame) {
      privateModule = new PrivateModule(currentPath = toAbsJsPath(name || currentPath, currentDir), currentPath, currentDir = toDir(currentPath));
      privateRequire = createPrivateRequire(currentDir)
    }
    if (!isFunc(_define)) {
      var exports = _define;
      _define = function () {
        var module = arguments[arguments.length - 2];
        var _exports = exports;
        exports = UNDEFINED;
        if (module) {
          module.exports = _exports;
        }
      }
    } /*else {
      /!**
       *
       * @name getMR
       * @type {function(*): {Window}}
       *!/
      _define.getMR = getMR;
      /!**
       * @name getM
       * @type {function(*): window.module}
       *!/
      _define.getM = getM;
      /!**
       *
       * @name getR
       * @type {function(*): window.require}
       *!/
      _define.getR = getR;


    }*/
    var callback = function (define, state/*, errArr*/) {
      var path = currentPath, id = privateModule[moduleNameId], ret, module;

      if (state) {
        define = define[1];
        var e1 = isEmptyModule(privateModule), e2 = isEmptyModule(publicModule);
        if (define !== UNDEFINED && e1 && e2) {
          privateModule[isLock] = FALSE;
          privateModule.exports = define;
        }
      }
      cacheExports(privateModule, id);
      cacheExports(publicModule, id);
      module = getExportsCacheValue(id);
      if (notCache) {
        removeModule(id, 1)
      }
      notCache = currentPath = privateModule = currentDir = callback = UNDEFINED;
      ret = {state: state, module: module, name: id, path: path};
      // if (!state && errArr) {
      //   for (var i = 0; i < errArr.length; i++) {
      //     if (errArr[i].name !== ret.name) {
      //       errArr.push(ret);
      //     }
      //   }
      // }
      //execCallback(index, ret, errArr)
      execCallback(index, ret)
    };

    var _thisArg = new ModuleArg(privateModule, privateRequire);
    if (_require && _require.length) {
      requireModule(currentDir, isArray(_require) ? _require : [_require], _depMap, function (args/*, err*/) {
        args[isDefineMethod ? 'push' : 'unshift'](_thisArg.require);
        var ret = tryCallRet(_define, args, 1, _thisArg);
        _define = isDefineMethod = _thisArg = UNDEFINED;
        callback(ret, ret[0]/*, err*/);
      })
    } else {
      var ret = tryCallRet(_define, [privateRequire], 1, _thisArg);
      _define = _thisArg = UNDEFINED;
      callback(ret, ret[0]);
    }
  }

  function ModuleArg(module, require) {
    this.module = module;
    this.require = require;
  }

  ModuleArg.prototype = {
    get exports() {
      var module = this.module;
      if (module) {
        return module.exports
      }
    },
    set exports(value) {
      var module = this.module;
      if (module) {
        module.exports = value
      }
    }
  };

  function getExportsCache(id) {
    return exportsCache[id]
  }

  function getExportsCacheValue(id) {
    /**
     * @type{{value}}
     */
    var exports = exportsCache[id];
    return exports && exports.value;
  }


  var publicModule = window.module = new PublicModule();
  var scriptQueue = publicModule.scriptQueue = {};
  window.modulePlugins = publicModule.plugins = {
    /*    ajax: function () {

        },
        css: function () {

        },*/
    js: function (info, complete) {
      var path = info.path;
      var notCache = info.notCache;
      var queue = scriptQueue[path], isUn = !queue, isInclude = isUn || !queue.length;
      if (isFunc(complete)) {
        var timeout = globalConfig.timeout || 20e3;
        var sid = setTimeout(function () {
          sid = UNDEFINED;
          var _complete = complete;
          complete = UNDEFINED;
          if (isFunc(_complete)) {
            _complete(UNDEFINED, [{type: 'Timeout', error: '请求超时'}]);
          }
        }, timeout);
        if (isUn) {
          queue = scriptQueue[path] = []
        }
        queue.push(function (module, error) {
          if (sid !== UNDEFINED) {
            clearTimeout(sid);
            var _complete = complete;
            complete = UNDEFINED;
            if (isFunc(_complete)) {
              _complete(module, error);
            }
          }
        });
      }
      if (isInclude) {
        includeScript(path, function (isLoad, currentPath) {
          var callback = function (module, error) {
            callback = UNDEFINED;
            queue = scriptQueue[path];
            if (queue) {
              for (var i = 0, _callback; i < queue.length; i++) {
                _callback = queue[i];
                _callback(module, error)
              }
            }
          };
          if (isLoad) {
            syncsModule(notCache, currentPath, callback)
          } else {
            callback(UNDEFINED, [{type: 'LoadFailed', error: '请求超时'}])
          }
        })
      }
    },
    /*    text: function () {

        },
        get: function () {

        },
        post: function () {

        },
        json: function () {

        },
        jsonp: function () {

        }*/
  };

  function setScriptOnValue(script, value) {
    script.onload = script.onerror = script.onabort = value;
  }

  function includeScript(src, callback) {
    var script = document.createElement("script");
    script.src = src;
    script.async = TRUE;
    script.defer = TRUE;
    if (callback) {
      setScriptOnValue(script, function (e) {
        var _callback = callback;
        setScriptOnValue(this, callback = UNDEFINED);
        _callback(e.type === 'load', this.src);
      });
    }
    head.append(script);
    head.removeChild(script)
  }


  function requireMain(currentDir, paths, then, error, complete, depMap) {
    var _depMap;
    if (isObject(then)) {
      _depMap = then;
      then = error;
      error = complete;
      complete = _depMap;
    } else if (isObject(error)) {
      _depMap = depMap;
      depMap = error;
      error = complete;
      complete = _depMap;
    } else if (isObject(complete)) {
      _depMap = depMap;
      depMap = complete;
      complete = _depMap;
    }
    depMap = isObject(_depMap) ? depMap : UNDEFINED;
    if (isFunc(then) || isFunc(error) || isFunc(complete)) {
      paths = isArray(paths) ? paths : [paths]
    }
    if (isArray(paths)) {
      requireModule(currentDir, paths, depMap, function (args, err) {
        if (err.length) {
          if (isFunc(error)) {
            tryCall(error, err)
          }
        } else if (isFunc(then)) {
          tryCall(then, args, 1)
        } else {
          complete(args, err);
        }
      });
      return;
    }
    return requireModule(currentDir, paths, depMap);
  }

  function setSyncs(module, value) {
    if (isFunc(value)) {
      /* var syncsOption = module[syncsOptionName], l;
       if (syncsOption && (l = syncsOption.length)) {
         value = assign({define: value}, syncsOption[l - 1]);
        module[syncsOptionName] = UNDEFINED;
       }*/
      var syncsOption = module[syncsOptionName];
      if (syncsOption) {
        value = assign({define: value}, syncsOption);
        module[syncsOptionName] = UNDEFINED;
      }
    }
    module[syncsName].push(value)
  }

  function setSyncsOption(module, deps) {
    var depMap = deps.pop();
    if (!isObject(depMap)) {
      deps.push(depMap);
      depMap = UNDEFINED
    }
    if (depMap || deps.length) {
      /*var syncsOption = module[syncsOptionName];
      if (!syncsOption) {
        syncsOption = module[syncsOptionName] = [];
      }
      syncsOption.push({
        depMap: depMap,
        require: deps,
      });*/
      module[syncsOptionName] = {
        depMap: depMap,
        require: deps,
      };
    }
  }

  window.require = function (paths, then, error, depMap) {
    if (isArray(paths) && (then === TRUE || then === FALSE) && error == NULL && depMap == NULL) {
      if (then === TRUE) {
        setSyncsOption(publicModule, paths);
        return
      } else {
        return paths;
      }
    }
    return requireMain(getBaseUrl(), paths, then, error, depMap)
  };
  var publicRequire = window.require;
  publicRequire.config = setConfig;

  function tryDelete(obj, name) {
    if (name in obj) {
      try {
        obj[name] = UNDEFINED;
        delete obj[name];
      } catch (e) {
      }
    }
  }

  function tryCall(func, args, isApply) {
    var nonApply = !isApply;
    if (isFunc(func)) {
      try {
        if (nonApply) {
          func(args)
        } else {
          func.apply(NULL, args)
        }

      } catch (e) {
        CONSOLE.error(e)
      }
    }
  }

  function tryCallRet(func, args, isApply, thisArg) {
    var nonApply = !isApply;
    if (isFunc(func)) {
      try {
        return {state: TRUE, ret: nonApply ? func(args) : func.apply(thisArg, args)};
      } catch (e) {
        CONSOLE.error(e);
        return {state: FALSE, error: e.message}
      }
    }
  }

  /*  function tryCallTrue(func, args, isApply) {
      var nonApply = !isApply;
      if (isFunc(func)) {
        try {
          if (nonApply) {
            func(args)
          } else {
            func.apply(NULL, args)
          }
          return TRUE;
        } catch (e) {
          CONSOLE.error(e)
        }
      }
    }*/

  /* function funcCall(func, args, isApply) {
     return tryCall(func, args, isApply)
   }
 */

  function isFunc(func) {
    return func && typeof func === "function";
  }

  function getExportsCacheCall(id, callback) {
    var module = getExportsCacheValue(id);
    if (module) {
      if (callback) {
        callback(module.value);
      }
      return module;
    }
  }

  function isNotCachePath(path) {
    return /#[\s\S]*!cache/i.test(path)
  }

  function requireModuleOne(currentDir, path, depMap, complete) {
    var notCache = isNotCachePath(path), canCache = !notCache, module = canCache && getExportsCacheCall(toNoHashUrl(path), complete = complete || FALSE);
    if (module) {
      return module.value;
    }
    var deps = depMap && depMap[path], info;
    if (!deps) {
      info = getModuleInfo(path, currentDir, complete)
    } else {
      var params;
      if (isObject(deps) && !isArray(deps)) {
        params = deps.params;
        deps = deps.deps;
        path = deps.path || path;
      }

      info = path[0] === '@' ? getModuleInfo(path, currentDir, complete) : {
        deps: deps,
        notCache: notCache,
        canCache: canCache,
        path: toAbsJsPath(path, currentDir)
      };
      if (params !== UNDEFINED) {//覆盖 参数
        if (info.params !== UNDEFINED) {
          info.originalParams = info.params;
        }
        info.params = params;
      }
    }
    module = info.module || getExportsCache(info.path, complete);
    if (module) {
      return module.value;
    }
    deps = info.deps;
    var requireMethod = function () {
      var _info = info, _complete = complete;
      info = complete = UNDEFINED;
      execRequireModule(_info, _complete)
    };
    if (!deps) {
      requireMethod();
    } else {
      requireModule(deps, depMap, requireMethod)
    }
  }


  function execRequireModule(info, complete) {
    var methodsMatch = info.originalPath.match(/#[\s\S]*\.([a-zA-Z0-9_]+)\(([^()]*)\)[\s\S]*$/), methodName, params;
    if (methodsMatch) {
      methodName = methodsMatch[1];
      params = methodsMatch[2].trim();
    }
    if (!methodName) {
      methodsMatch = info.path.match(/\.([a-zA-Z0-9]+)(\?[\s\S]*)*$/);
      if (methodsMatch) {
        methodName = methodsMatch[1]
      }
    }

    var method = publicModule.plugins[methodName] || publicModule.plugins[methodName = 'js'];
    if (isFunc(method)) {
      method(info, complete, params)
    } else if (isFunc(complete)) {
      var error = '"module.plugins.' + methodName + '"不是一个函数';
      complete(UNDEFINED, {path: info.path, type: 'TypeError', error: error})
    }

  }

  function createRequireEachCallback(callback, index) {
    return function (module, error) {
      callback(index, module, error)
    }
  }

  /**
   *
   * @param currentDir
   * @param paths
   * @param depMap
   * @param complete
   */
  var requireModule = function (currentDir, paths, depMap, complete) {
    if (isArray(paths)) {
      if (paths.length === 0) {
        complete([]);
        return;
      }
      var arr = [], err = [], length = paths.length;
      var callback = function (index, module, error) {
        arr[index] = module;
        if (error) {
          err.push(error)
        }
        if (--length <= 0) {
          complete(arr, err)
        }
      };
      for (var i = 0, path; i < length; i++) {
        requireModuleOne(currentDir, path = paths[i], depMap, createRequireEachCallback(callback, i, path))
      }
      return;
    }
    return requireModuleOne(currentDir, paths, depMap, complete)

  };

  publicRequire.ACDM = TRUE;
  cacheModule('require', publicRequire);
  cacheModule('module', publicModule);
  if (mainPath) {
    requireModule(mainPath);
  }
}();
