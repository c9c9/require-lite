///当前路径为 https://server.domain/examples/currentDir/path.js
require.config({
  timeout: 20e3,
  baseUrl: 'https://server.domain/examples/',
  alias: {
    dep5Alias: "dep5AliasFinal",
    dep4Alias: "@dep5Alias",
    dep3Alias: {
      params: {param: 'module.plugins 要传入的参数'},
      deps: ['dep4Alias'],
      path: 'dep3AliasFinal'
    },
    dep2Alias: {
      path: '@dep3Alias'
    }
  }
});

/// 引入 id 为 https://server.domain/examples/currentDir/dep.js 的模块 dep
/// 引入 id 为 https://server.domain/examples/dep3AliasFinal.js 的  dep1 的 依赖模块
/// 引入 id 为 https://server.domain/examples/currentDir/dep1.js 的模块 dep1
/// 引入 id 为 https://server.domain/examples/dep5AliasFinal.js 的  dep2 的 依赖模块
/// 引入 id 为 https://server.domain/examples/dep3AliasFinal.js 的模块 dep2
/// 引入 id 为 https://server.domain/examples/dep5AliasFinal.js 的模块 dep3
/// 生成 id 为 https://server.domain/examples/currentDir/path.js 的模块
define(['dep', "dep1", "dep2", "@dep4Alias"], function (dep, dep1, dep2, dep3, _require) {
  //require 全局的 require  目录路径为 https://server.domain/examples/
  //_require 私有的 require 目录路径为 https://server.domain/examples/current
  require('dep');//https://server.domain/examples/dep.js
  dep === this.require('dep') === _require('dep');//https://server.domain/examples/currentDir/dep.js

  //导出的 模块为 {key1:1,key2:2}
  module.exports.key1 = 1;
  module.exports.key2 = 2;
  //等同于
  module.exports = {key1: 1, key2: 2};
  //this.module 指向 优先级更高的 私有的 module 所以 导出的 模块重写为 {key3:3,key4:4}
  this.module.exports.key3 = 3;
  this.module.exports.key4 = 4;
  //等同于
  this.module.exports = {key3: 3, key4: 4};
  //等同于
  this.exports = {key3: 3, key4: 4};
  //
  //如果没有设置  module.exports 或 this.module.exports 将使用 返回值作为导出的模块
  return {}
}, {dep1: {deps: ['des']}, dep2: {params: {param: '重置参数'}, path: '@dep2Alias'}}/*depMap 可选*/);
//等同于
module.syncs = {
  methodName: 'define',
  name: '',
  require: ['dep', "dep1", "dep2", "@dep4Alias"],
  depMap: {dep1: {deps: ['des']}, dep2: {params: {param: '重置参数'}, path: '@dep2Alias'}},//depMap 可选
  define: function (dep, dep1, dep2, dep3, _require) {

  }
};

/// 引入 id 为 https://server.domain/examples/currentDir/dep.js 的模块 dep
/// 引入 id 为 https://server.domain/examples/dep3AliasFinal.js 的  dep1 的 依赖模块
/// 引入 id 为 https://server.domain/examples/currentDir/dep1.js 的模块 dep1
/// 引入 id 为 https://server.domain/examples/dep5AliasFinal.js 的  dep2 的 依赖模块
/// 引入 id 为 https://server.domain/examples/dep3AliasFinal.js 的模块 dep2
/// 引入 id 为 https://server.domain/examples/dep5AliasFinal.js 的模块 dep3
/// 生成 id 为 https://server.domain/examples/currentDir/path.js 的模块
require(['dep', "dep1", "dep2", "@dep4Alias",/*depMap 可选*/{dep1: {deps: ['des']}, dep2: {params: {param: '重置参数'}, path: '@dep2Alias'}}], true);
module.syncs = function (require, dep, dep1, dep2, dep3) {
};
//等同于
module.syncs = {
  name: '',
  require: require(['dep', "dep1", "dep2", "@dep4Alias"], false),
  depMap: {dep1: {deps: ['des']}, dep2: {params: {param: '重置参数'}, path: '@dep2Alias'}},//depMap 可选
  define: function (require, dep, dep1, dep2, dep3) {
  }
};

/// 引入 id 为 https://server.domain/examples/currentDir/dep.js 的模块
/// 生成 id 为 https://server.domain/examples/path.js 的模块
define("../path", ["dep"], function (dep, require) {

});

/// 引入 id 为 https://server.domain/examples/currentDir/dep.js 的模块
/// 生成 id 为 https://server2.domain/path.js 的模块
define("//server2.domain/path", ["dep"], function (dep, require) {
});
/// 引入 id 为 https://server.domain/examples/currentDir/dep.js 的模块
/// 生成 id 为 http://server2.domain/path.js 的模块
define("http://server2.domain/path", ["dep"], function (dep, require) {
});
// plugin_name = /[a-zA-z0-9_]+/
module.plugins.plugin_name = function (info = {
  params: {},
  originalParams: {},
  notCache: true,
  canCache: false,
  deps: null,
  originalPath: '/path.js#!cache .plugin_name(paramsJson)',
  path: "http://server.domain/path.js"
}, complete, paramsJson) {
  JSON.parse(paramsJson);
  var exports = {}, error = null;
  if (info.canCache) {
    module.update(info.path, exports);
    error=false;
  }
  if (!error) {
    complete(exports);
  } else {
    error = {path: info.path, type: '', error: error};
    complete(exports, error);
  }
};
