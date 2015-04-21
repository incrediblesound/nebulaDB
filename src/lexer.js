var fs = require('fs');
var _ = require('./lib/helpers.js');

module.exports = function(line){
	line = line.split(/(\?|\-\>|\:|\-\!|\,|\^|\s)/);
	line = _.noEmpties(line);
	return line;
}
