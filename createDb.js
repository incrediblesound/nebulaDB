var program = require('commander');
var createDb = require('./src/createDatabase.js');

program.parse(process.argv);

var name = program.args[0];

createDb(name);
