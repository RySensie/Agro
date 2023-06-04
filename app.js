'use strict';
require("dotenv").config()
require('module-alias/register')

var HapiServer = require('./src/config/hapi');

require('./src/database/mongodb');

HapiServer.start(function () {
  console.log('Server is running at : ' + HapiServer.info.uri);
});
