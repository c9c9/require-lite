///当前路径为 https://server.domain/examples/currentDir/path.js
require.config({
  timeout: 20e3,
  baseUrl: 'https://server.domain/examples/',
  alias: {
    //like webpack
  },
  paths:{
  //like requirejs
  },
  shim{
    //like requirejs
  }
});
