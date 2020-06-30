///当前路径为 https://server.domain/examples/currentDir/path.js
require.config({
  timeout: 20e3,
  baseUrl: 'https://server.domain/examples/',
  alias: {
    //like wepack
  },
  paths:{
  //like requirejs
  },
  shim{
    //like requirejs
  }
});
