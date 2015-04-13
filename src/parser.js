var _ = require('./lib/helpers.js');
var Entity = require('./lib/entity.js').Entity;
var Set = require('./lib/set.js').Set;
var compiler = require('./compiler.js');

var relations = new Set(['->','-!'])

module.exports = function(lines){
	var stack = [], entity;
	_.forEach(lines, function(line){
		entity = new Entity();
		if(line[0] === '?'){ // a query just tests whether the statement is true
			entity.query = true;
			line.shift();
		}
		_.forEach(line, function(part, idx){
			if(idx === 1){
				entity.addRelation(part);
			}
			else if(part === '^'){
				entity.makeCompound();
			}
			else {
				part = _.processValue(part);
				entity.addValue(part);
			}
		})
		stack.push(entity);
	})
	return stack;
}