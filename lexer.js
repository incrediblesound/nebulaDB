var fs = require('fs');
var parser = require('./parser.js')
var program = require('commander');
var _ = require('./helpers.js');

program.parse(process.argv);
var body = fs.readFileSync('./'+program.args[0]+'.pnt').toString();
var result = [];
body = body.split(/(\r\n|\n|\r)/);
_.forEach(body, function(line){
	if(!(/(\r\n|\n|\r)/).test(line) && line.length){
		line = line.split(/(\?|\-\>|\:|\-\!|\,)/);
		line = _.noEmpties(line);
		result.push(line);
	}
})
parser(result);