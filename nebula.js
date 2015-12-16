var program = require('commander');

program.parse(process.argv);

var name = program.args[0];

var nebulaServer = require('./src/server.js')(name);