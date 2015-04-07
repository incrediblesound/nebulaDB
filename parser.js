var _ = require('./helpers.js');
var Entity = require('./entity.js').Entity;
var Set = require('./set.js').Set;
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
		if(line[1] === ':'){ // a relation definition adds a new relation and connects it to two members
			relations.add(line[0]);
			line = [ line[2], line[0], line[4] ];
		}

		_.forEach(line, function(part, idx){
			if(relations.contains(part) && idx !== 0 && idx !== 2){
				entity.addRelation(part);
			}
			else {
				part = _.processValue(part);
				entity.addValue(part);
			}
		})
		stack.push(entity);
	})
	compiler(stack);
}