void function () {
  var win = window, req = win.require;

  function isFunction(o) {
    return typeof o === "function"
  }

  if (isFunction(req) && req.ACMD) {
    return
  }
  var ArraySlice = Array.prototype.slice, doc = document, script = doc.getElementById('ACMD-DST') || doc.currentScript,
    UNDEFINED = undefined, NULL = null, FALSE = false, TRUE = true, CONSOLE = console;
  var hasOwn = Object.prototype.hasOwnProperty, isArray = Array.isArray;//, assign = OBJ.assign, arrayConcat = Array.prototype.concat
  var head = doc.head || doc.getElementsByTagName('head')[0]
    , base = doc.createElement('base');
  var mainPath, currentPath, pageBasePath = getPageBasePath();
  if (!script) {
    doc.querySelectorAll('script').forEach(function (_require) {
      if (_require.src.search(/[/\\]require(\.min)*\.js/i) > -1) {
        script = _require;
      }
    })
  }
  if (script) {
    mainPath = script.getAttribute('data-main');
    if (mainPath) {
      mainPath = toAbsJsPath(mainPath, toDir(pageBasePath))
    }
  }
  currentPath = mainPath || pageBasePath;
  var currentBaseUrl = toDir(currentPath);

  function isString(o) {
    return typeof o === "string"
  }

  function isObject(o) {
    return !!o && typeof o === "object"
  }

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
    path = path + (!path || /[/\\]$/.test(path) ? '' : '/') + (/\.[^/\\]+$/.test(path) ? '../' : './');
    path = toAbsUrl(path)
    return path;
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
    return toAbsUrl(isAbsUrl(path) ? path : currentDir + path).trim().replace(/([^:])[/\\]{2,}/, '$1/');
  }

  function toAbsUrl(url) {
    base.href = isAbsUrl(url) ? url : url;
    return base.href;
  }

  function toAbsJsPath(path, currentDir) {
    return toAbsPath(toJsPath(toNoHashUrl(path)), currentDir).replace(/(\?+&*|&+)$/, '')
  }


  function setScriptOnValue(script, on) {
    script.onload = script.onerror = script.onabort = on;
  }

  function includeScript(src, callback) {
    var script = doc.createElement("script");
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

  function tryDelete(obj, name) {
    if (obj && name in obj) {
      obj[name] = UNDEFINED;
      try {
        delete obj[name];
      } catch (e) {
      }
    }
  }

  var currentScriptLoadQueue = NULL;

  var publicConfig = {
      timeout: 20e3,
      baseUrl: currentBaseUrl,
      baseDir: toDir(currentBaseUrl),
      alias: {},
      paths: {},
      modules: {}
    },
    modules = {};


  function replaceAliasToPath(path) {
    return path.replace(/^([@~][^\/\\])[\/\\]/, function (m, n) {
      return publicConfig.alias[n] || m
    });
  }

  function getOrSetObj(obj, name) {
    return obj[name] || (obj[name] = {})
  }

  function getPCPath(path, name, pc_paths, baseDir, toId) {
    path = path || name;
    name = name || path;
    var _path = (pc_paths || publicConfig.paths)[name];
    if (_path) {
      return _path
    }
    _path = toAbsJsPath(replaceAliasToPath(path), baseDir);
    return toId ? toLowerCaseUrl(_path) : _path
  }

  function getPCMByPath(path, baseDir) {
    var abs_path = publicConfig.paths[path];
    if (!abs_path) {
      abs_path = toAbsJsPath(replaceAliasToPath(path), baseDir);
    }
    var id_path = toLowerCaseUrl(abs_path)
    return {
      id: id_path,
      config: publicConfig.modules[id_path],
      path: abs_path
    }
  }


  function setModulesConfigByPath(pc_modules, pc_paths, name, path, baseDir) {
    if (isString(path)) {
      var paths = path.split("#");
      var ver = paths[1];
      path = getPCPath(paths[0], name, pc_paths, baseDir)
      var id_path = toLowerCaseUrl(path)
      if (name !== path) {
        pc_paths[name || path] = id_path;
      }
      var module = getOrSetObj(pc_modules, id_path), index = path.indexOf('?');
      module.path = path + (index > -1 ? '' : '?') + (index === -1 || index === path.length - 1 ? '' : '&') + '__js_ver__' + ver;
    } else if (path === NULL) {
      path = pc_paths[name];
      if (path) {
        tryDelete(pc_paths, name);
        tryDelete(pc_modules, path);
      }
    }
  }

  function setModulesConfigByShim(pc_modules, pc_paths, name, shim, baseDir) {
    var module = getOrSetObj(pc_modules, getPCPath(pc_paths[name], name, pc_paths, baseDir, TRUE));
    if (isArray(shim)) {
      shim = {deps: shim}
    }

    module.deps = shim.deps;
    module.exports = shim.exports;
  }

  function getBaseDirByOption(descOption) {
    return descOption && isString(descOption.baseUrl) ? toDir(descOption.baseUrl) : publicConfig.baseDir
  }

  function privateDefine(currentDir, currentId, privateModule, name, deps, factory, options, complete) {
    if (!deps || !deps.length) {
      privateModule.define(name, factory);
      complete();
    } else {
      var id = privateModule.getId(name);
      if (!modules[id]) {
        addRequireLoadQueue(id);
      }
      privateRequire(currentDir, currentId, privateModule, deps, function () {
        privateModule.defineById(id, factory, arguments);
        complete();
        privateModule = factory = id = complete = NULL;
      }, function (error, errorId) {
        privateModule.errorById(id, error, errorId)
        complete();
        privateModule = factory = id = complete = NULL;
      }, options)
    }
  }

  function eachCurrentScriptLoadQueue(isLoad, currentDir, currentId, autoSave, error, errorId) {
    var queue = currentScriptLoadQueue || [];
    currentScriptLoadQueue = NULL;
    var privateModule = createPrivateModule(currentDir, currentId);
    var config = publicConfig.modules[currentId];
    if (config) {
      var exports = config.exports;
      if (isString(exports)) {
        exports = function () {
          return window[exports]
        }
      }
      if (exports !== UNDEFINED) {
        queue.push({isDefine: TRUE, params: [UNDEFINED, config.deps, exports]})
      }
    }
    var length = queue.length, count = 0;

    function complete() {
      if (autoSave && ++count >= length) {
        if (isLoad) {
          privateModule.save()
        } else {
          privateModule.errorById(currentId, error || "加载模块文件失败", errorId || currentId)
        }
        privateModule = NULL;
      }
    }

    if (length && isLoad) {
      var item, params, name;
      for (var i = 0; i < length; i++) {
        item = queue[i];
        params = item.params;
        if (item.isRequire) {
          requireMain(currentDir, params[0], params[1], params[2], currentId, privateModule, complete);
        } else {
          name = params[0];
          privateDefine(currentDir, privateModule.getId(name), privateModule.toModuleByPath(name), name, params[1], params[2], params[3], complete)
        }
      }
    } else {
      complete(count = length)
    }
  }

  function nonEmpty(obj) {
    for (var k in obj) {
      if (hasOwn.call(obj, k)) {
        return TRUE
      }
    }
    return FALSE
  }

  function getModuleById(id) {
    var module = modules[id]
    if (module) {
      if (module.error) {
        CONSOLE.error('模块 [' + id + '] ' + module.error + '。')
      } else {
        return module.value
      }
    }
  }

  function createPrivateModule(currentDir, currentId) {
    var exports, _exports = exports = {};
    var save = function (id, module, error, errorId) {
      id = id || currentId;
      var value = !error && module === UNDEFINED && id === currentId && (exports !== _exports || nonEmpty(exports)) ? exports : module;
      exportModule(id, value, error, errorId, arguments.length !== 0)
    };
    var toUrl = function (url) {
      if (!url) {
        return currentDir
      }
      var module = getPCMByPath(url);
      return module.config && module.config.path || module.path
    }
    var getId = function (path) {
      if (isString(path) && path) {
        return getPCPath(path, NULL, NULL, currentDir, TRUE)
      } else {
        return currentId
      }
    }
    var define = function (path, factory, args) {
      if (arguments.length === 1) {
        factory = path;
        path = NULL;
      }
      defineById(getId(path), factory, args);
    }
    var defineById = function (id, factory, args) {
      try {
        save(id, isFunction(factory) ? args ? factory.apply(NULL, args) : factory() : factory);
      } catch (e) {
        CONSOLE.error('模块 [' + id + '] 定义失败。', e);
        errorById(id, '模块定义失败', id)
      }
    }
    var errorById = function (id, error, errorId) {
      save(id, UNDEFINED, error, errorId)
    }

    function require(paths, then, error, pathsDescOption) {
      if (arguments.length < 2 && isString(paths)) {
        var id = getId(paths);
        return getModuleById(id)
      } else {
        privateRequire(currentDir, currentId, privateModule, paths, then, error, pathsDescOption)
      }
    }

    require.promise = function (paths, pathsDescOption) {
      return toRequirePromise(require, paths, pathsDescOption)
    }
    var privateModule = {
      save: save,
      defineById: defineById,
      toModuleByPath: function (path) {
        return path && isString(path) ? createPrivateModule(currentDir, getId(path)) : privateModule;
      },
      getId: getId,
      error: function (path, error, errorId) {
        errorById(getId(path), error, errorId)
      },
      errorById: errorById,
      define: define,
      require: require,
      module: {
        toUrl: toUrl,
        get exports() {
          return exports;
        },
        set exports(value) {
          exports = value;
        }
      },
      get exports() {
        return exports
      }
    }
    return privateModule;
  }

  function requireJS(src, currentId, currentDir, error, errorId) {
    currentDir = toDir(src);
    setTimeout(function () {
      currentScriptLoadQueue = NULL;
      var load = function (isLoad) {
        if (requireOnload) {
          requireOnload(isLoad, currentDir, currentId, error, errorId)
        } else {
          eachCurrentScriptLoadQueue(isLoad, currentDir, currentId, TRUE, error, errorId);
        }
      }
      if (error) {
        load(FALSE)
      } else {
        includeScript(src, load)
      }
    })
  }

  var modulePlugins = {}

  var require_str = "require", define_str = "define", module_str = "module", exports_str = "exports";
  var sync_str_arr = [require_str, define_str, module_str, exports_str];
  var requireOnload;

  function pushToLoadQueue(baseDir, item) {
    if (!requireOnload) {
      requireOnload = function (isLoad, currentDir, currentId, error, errorId) {
        if (requireOnload) {
          var sid = requireOnload.sid;
          if (sid) {
            clearTimeout(sid)
            requireOnload.sid = NULL;
          }
          requireOnload = NULL;
        }
        eachCurrentScriptLoadQueue(isLoad, currentDir, currentId, TRUE, error, errorId);
      }
      requireOnload.sid = setTimeout(function () {
        if (requireOnload) {
          requireOnload.sid = NULL;
          requireOnload(TRUE, baseDir)
        }
      });
    }
    (currentScriptLoadQueue = currentScriptLoadQueue || []).push(item);
  }

  function privateRequire(currentDir, currentId, privateModule, paths, then, error, pathsDescOption) {
    if (isString(paths)) {
      /*if (!then && !error) {
        return;
      }*/
      paths = [paths];
    } else if (isFunction(paths) && !isFunction(error)) {
      pathsDescOption = error;
      error = then;
      then = paths;
      paths = sync_str_arr;
    }
    if (isObject(then)) {
      pathsDescOption = then;
      error = then = UNDEFINED;
    } else if (isObject(error)) {
      pathsDescOption = error;
      error = UNDEFINED;
    }
    var baseDir = currentDir || getBaseDirByOption(pathsDescOption);
    var requires = [], isSync = FALSE;
    pathsDescOption = pathsDescOption || {}
    var pc_paths = publicConfig.paths;
    paths = isArray(paths) ? paths : [];
    for (var i = 0, l = paths.length, path; i < l; i++) {
      path = paths[i];
      if (sync_str_arr.indexOf(path) > -1) {
        requires.push(path);
        isSync = TRUE;
      } else {
        isSync = isSync || !pc_paths[path];
        requires.push({path: path, option: pathsDescOption[path]})
      }
    }
    if (isSync && !currentDir) {
      pushToLoadQueue(baseDir, {isRequire: TRUE, params: [requires, then, error]});
    } else {
      requireMain(baseDir, requires, then, error, currentId, privateModule || l && createPrivateModule(baseDir, currentId))
    }

  }

  var publicRequire = win.require = function (paths, then, error, pathsDescOption) {
    privateRequire(NULL, NULL, NULL, paths, then, error, pathsDescOption)
  }


  function toPromiseCall(func) {
    return function () {
      func(ArraySlice.call(arguments))
    };
  }

  function toRequirePromise(require, paths, pathsDescOption) {
    return new Promise(function (resolve, reject) {
      require(paths, toPromiseCall(resolve), toPromiseCall(reject), pathsDescOption)
    })
  }

  publicRequire.promise = function (paths, pathsDescOption) {
    return toRequirePromise(publicRequire, paths, pathsDescOption)
  }
  publicRequire.config = publicRequire.setConfig = function (config) {
    if (isObject(config)) {
      var timeout = config.timeout,
        baseUrl = config.baseUrl,
        alias = config.alias || {},
        paths = config.paths || {},
        shim = config.shim || {};

      if (isFinite(timeout)) {
        publicConfig.timeout = timeout
      }
      if (isString(baseUrl) && publicConfig.baseUrl !== baseUrl) {
        publicConfig.baseUrl = baseUrl;
        publicConfig.baseDir = toDir(baseUrl)
      }
      var baseDir = publicConfig.baseDir;
      var pc_modules = publicConfig.modules, pc_paths = publicConfig.paths, pc_alias = publicConfig.alias;

      for (var n in alias) {
        if (alias.hasOwnProperty(n)) {
          pc_alias[n] = toAbsPath(alias[n], baseDir)
        }
      }
      for (n in paths) {
        if (paths.hasOwnProperty(n)) {
          setModulesConfigByPath(pc_modules, pc_paths, n, paths[n], baseDir);
        }
      }
      for (n in shim) {
        if (shim.hasOwnProperty(n)) {
          setModulesConfigByShim(pc_modules, pc_paths, n, shim[n], baseDir);
        }
      }
    }
    return publicConfig
  };
  publicRequire.ACMD = TRUE;
  publicRequire.setPlugins = function (name, main) {
    if (/^[0-9a-z_]+$/i.test(name)) {
      modulePlugins[name] = main
    } else {
      CONSOLE.error('无效的插件名 ' + name + ',插件名应由 0-9、a-Z、_ 组成。')
    }
  }
  var requireLoadQueue = {};

  function eachRequireLoadQueue(id, module, error, errorId) {
    var queue = requireLoadQueue[id];
    if (queue && id) {
      tryDelete(requireLoadQueue, id);
      for (var i = 0, l = queue.length, func; i < l; i++) {
        if ((func = queue[i])) {
          func(module, error, errorId)
        }
      }
    }
  }

  function exportModule(id, module, error, errorId, existErrorLog) {
    if (!id) {
      //CONSOLE.error('无效的模块Id [' + id + ']。')
    } else if (!modules[id]) {
      module = {value: module, error: error, errorId: errorId};
      modules[id] = module;
      eachRequireLoadQueue(id, module.value, error, errorId);
    } else if (existErrorLog) {
      CONSOLE.error('模块 [ ' + id + ' ] 已存在，不能重复定义。')
    }
  }

  function requireMain(currentDir, requires, then, error, currentId, privateModule, complete) {
    var length = requires.length;
    if (length === 0) {
      if (isFunction(then)) {
        then();
      }
    } else {
      var count = 0, isComplete, _modules = [];
      var load = function (index, module, err, id) {
        _modules[index] = module
        if (isComplete) {
          return
        }
        if (++count >= length || err) {
          isComplete = TRUE;
          try {
            if (err) {
              if (isFunction(error)) {
                error(err, id)
              }
            } else {
              if (isFunction(then)) {
                then.apply(NULL, _modules);
              }
            }
          } catch (e) {
            CONSOLE.error(e)
          }
          if (isFunction(complete)) {
            complete();
          }

          then = error = complete = NULL
        }
      }
      for (var i = 0, item, path, pluginName, pcm, module, id, method; i < length; i++) {
        item = requires[i];
        if (isString(item)) {
          load(i, privateModule[item]);
          continue;
        }
        path = item.path;
        if (!path || !isString(path)) {
          var _module;
          if (isFunction(path)) {
            try {
              _module = path();
            } catch (e) {
              CONSOLE.error(e)
            }
          }
          load(i, _module)
          continue;
        }
        pluginName = path.match(/^([0-9a-z_]+)!([\s\S]*)/i);
        if (pluginName) {
          path = pluginName[2].replace(/\s+/g, '')
          method = modulePlugins[pluginName = pluginName[1]]
        } else {
          pluginName = "未知";
          method = requireJS;
        }
        if (!path) {
          load(i, UNDEFINED)
          continue;
        }
        if (!isFunction(method)) {
          load(i, UNDEFINED, "无效的插件方法 [" + pluginName + "]", path)
          continue;
        }
        pcm = getPCMByPath(path, currentDir);
        if ((module = modules[id = pcm.id])) {
          load(i, module.value, module.error, module.errorId)
        } else {
          addToRequireLoadQueue(id, load, i, currentDir, method, pcm, item.option);
        }
      }
    }
  }

  function addRequireLoadQueue(id) {
    var queue = requireLoadQueue[id];
    if (!queue) {
      queue = requireLoadQueue[id] = [];
      queue.isFirst = TRUE;
    } else if (queue.isFirst) {
      queue.isFirst = FALSE;
    }
    return queue
  }

  function addToRequireLoadQueue(id, load, index, currentDir, method, pcm, option) {
    var queue = addRequireLoadQueue(id), isFirst = queue.isFirst;
    var sid, callback = function (module, error, errorId) {
      if (sid) {
        clearTimeout(sid);
        sid = NULL;
      }
      callback = NULL;
      load(index, module, error, errorId)
      index = load = NULL;
    };
    var timeout = publicConfig.timeout, path;
    var require = function (error, errorId) {
      sid = setTimeout(function () {
        var queue = requireLoadQueue[id], index;
        if (queue && (index = queue.indexOf(callback)) > -1) {
          queue.splice(index, 1)
          callback(UNDEFINED, "请求超时", id);
          id = NULL;
        }
      }, timeout);
      if (isFirst) {
        try {
          method(path, id, currentDir, error, errorId, option, exportModule, eachRequireLoadQueue)
        } catch (e) {
          eachRequireLoadQueue(id, UNDEFINED, '请求失败', errorId);
        }
        method = NULL;
      }
    }
    queue.push(callback);
    if (isFirst) {
      var config = pcm.config;
      var deps;
      if (config) {
        path = config.path;
        deps = config.deps;
      }
      if (!path) {
        path = pcm.path;
      }
      if (deps) {
        privateRequire(currentDir, id, NULL, deps, function () {
          require()
        }, function (error, errorId) {
          require(error, errorId)
        })
        return
      }
    }
    require();
  }


  //require, exports, module,define
  var define = win.define = function (name, deps, factory, pathsDescOption) {
    var argLen = arguments.length;
    if (argLen < 2) {
      factory = name;
      deps = name = UNDEFINED;
    } else if (argLen < 4) {
      if (!isString(name)) {
        pathsDescOption = factory;
        factory = deps;
        deps = name;
        name = UNDEFINED;
      } else if (!isArray(deps)) {
        pathsDescOption = factory;
        factory = deps;
        deps = UNDEFINED;
      }
    }
    pushToLoadQueue(getBaseDirByOption(pathsDescOption), {isDefine: TRUE, params: [name, deps, factory, pathsDescOption]})
  }
  define.amd = {
    toDir: toDir,
    toAbsUrl: toAbsUrl,
    toAbsPath: toAbsPath,
    toAbsJsPath: toAbsJsPath,
    toJsPath: toJsPath,
    toLowerCaseUrl: toLowerCaseUrl,
    toNoHashUrl: toNoHashUrl,
    toOriginUrl: toOriginUrl
  };

  if (mainPath) {
    publicRequire([mainPath])
  }
}();

void function () {
  if (typeof module !== "object" || !module) {
    try {
      window.module = {
        set exports(value) {
          define(function () {
            return value;
          })
        },
        get exports() {
          var _exports = {};
          define(_exports);
          return _exports;
        }
      }
    } catch (e) {

    }
  }
}();
