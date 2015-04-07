var _ = require('./helpers.js');
var variables = require('./variables.js')();
var Set = require('./set.js').Set;
var fs = require('fs');
var lib = require('./lib.js');
var exec = require('child_process').exec;

LIBRARY = {};
var result = '';
var queries = '';
var add = function(string){
	result += string;
};
var addQ = function(string){
	queries += string;
}

module.exports = function(stack){
	_.forEach(stack, function(entity){
		if(entity.query === true){
			createQuery(entity);
		} else {
			createEntities(entity);
		}
	})
	var output = '#include \"core.h\"\n\nint main(){\n'+result+';\n'+queries+'\n};\n';
	fs.writeFileSync('output.c', output);
	exec('gcc output.c -o out', function(err){
			if(err) console.log(err);
			// exec('rm -rf output.c');
			return;
	});
}

function createQuery(entity){
	var relationFunction = lib.relationToFunc[entity.relation.type];
	if(relationFunction !== undefined){
		addQ(relationFunction+'(');
		addQ('&'+LIBRARY[entity.source.content].varName+', &');
		addQ(LIBRARY[entity.target.content].varName+');\n');
	} else {
		addQ('custom_relation(');
		addQ('&'+LIBRARY[entity.relation.type].varName+', &');
		addQ(LIBRARY[entity.source.content].varName+', &');
		addQ(LIBRARY[entity.target.content].varName+');\n');
	}
}

function createEntities(entity){
	if(LIBRARY[entity.source.content] === undefined){
		LIBRARY[entity.source.content] = {};
		writeValueEntity(entity.source);
	}
	if(LIBRARY[entity.target.content] === undefined){
		LIBRARY[entity.target.content] = {};
		writeValueEntity(entity.target);
	}
	if(LIBRARY[entity.source.content][entity.target.content] === undefined){
		LIBRARY[entity.source.content][entity.target.content] = new Set();
	}
	LIBRARY[entity.source.content][entity.target.content].add(entity.relation.type);
	addRelationToObject({
		source: LIBRARY[entity.source.content].varName,
		target: LIBRARY[entity.target.content].varName,
		relation: entity.relation.type
	})
}

function writeValueEntity(value){
	var primitiveValue = _.processValue(value.content)
	var varName = variables.newVariable();
	var dataName = variables.newVariable();
	add('struct Node '+varName+';\n');
	add(varName+'.outgoing_len = 0;\n');
	add(varName+'.incoming_len = 0;\n');
	add(varName+'.outgoing = (struct Link *) malloc(sizeof(struct Link));\n');
	add(varName+'.incoming = (struct Link *) malloc(sizeof(struct Link));\n');
	add(varName+'.type = \''+lib.valueToType[value.type]+'\';\n');
	add('union Data '+dataName+';\n');
	if(value.type === 'string'){
		add(dataName+'.name = "'+primitiveValue+'";\n');
	} else {
		add(dataName+'.num = '+primitiveValue+';\n');
	}
	add(varName+'.data = '+dataName+';\n');
	LIBRARY[value.content]["varName"] = varName;
};

function addRelationToObject(options){
	var relationType = lib.relationToType(options.relation);
	if(relationType === 'c'){
		var customName = createCustomRelation(options.relation);
	}
	var relationName = variables.newVariable();
	add('struct Link '+relationName+';\n');
	add(relationName+'.source = &'+options.source+';\n');
	add(relationName+'.target = &'+options.target+';\n');
	if(customName !== undefined){
		add(relationName+'.custom = &'+customName+';\n');
		add('add_outgoing_link(&'+customName+', &'+relationName+');\n');
	}
	add(relationName+'.relation = \''+relationType+'\';\n');
	add('add_outgoing_link(&'+options.source+', &'+relationName+');\n');
	add('add_incoming_link(&'+options.target+', &'+relationName+');\n');
};

function createCustomRelation(type){
	if(LIBRARY[type].varName !== undefined){
		return LIBRARY[type].varName;
	}
	LIBRARY[type] = {};
	var varName = variables.newVariable();
	var dataName = variables.newVariable();
	add('struct Node '+varName+';\n');
	add(varName+'.outgoing_len = 0;\n');
	add(varName+'.outgoing = (struct Link *) malloc(sizeof(struct Link));\n')
	add(varName+'.incoming_len = 0;\n');
	add(varName+'.incoming = (struct Link *) malloc(sizeof(struct Link));\n')
	add(varName+'.type = \'s\';\n');
	add('union Data '+dataName+';\n');
	add(dataName+'.name = "'+type+'";\n');
	add(varName+'.data = '+dataName+';\n');
	LIBRARY[type]["varName"] = varName;
	return varName;
}