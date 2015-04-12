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
	_.forEach(stack, function(entity, idx){
		if(entity.query === true){
			createQuery(entity, idx);
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

function createQuery(entity, idx){
	var sourceNode = _.first(entity.source);
	var targetNode = _.first(entity.target);
	var sourceVarName = LIBRARY[sourceNode.content].varName
	var targetVarName = LIBRARY[targetNode.content].varName
	var relationFunction = lib.relationToFunc[entity.relation.type];
	if(relationFunction !== undefined){
		addQ(relationFunction+'(');
		addQ('&'+LIBRARY[sourceNode.content].varName+', &');
		addQ(LIBRARY[targetNode.content].varName+');\n');
	} else {
		var linkName;
		// try{
		// 	linkName = LIBRARY[sourceVarName][targetVarName][entity.relation.type];
		// 	console.log(sourceVarName, targetVarName, entity.relation.type)
		// } catch(err){
		// 	console.log("Error on line "+(idx+1));
		// 	console.log("No relation between "+entity.source[0].content+" and "+entity.target[0].content+".");
		// 	return;
		// }
		// if(linkName === undefined){
			linkName = LIBRARY[entity.relation.type].varName;
		// }
		addQ('custom_relation(');
		addQ('&'+linkName+', &');
		addQ(sourceVarName+', &');
		addQ(targetVarName+');\n');
	}
}

function createEntities(entity){
	var sourceNode = _.first(entity.source);
	if(LIBRARY[sourceNode.content] === undefined){
		LIBRARY[sourceNode.content] = {};
		writeValueEntity(sourceNode);
	}
	_.forEach(entity.target, function(targetNode){
		if(LIBRARY[targetNode.content] === undefined){
			LIBRARY[targetNode.content] = {};
			writeValueEntity(targetNode);
		}
	})
	// if(LIBRARY[entity.source.content][entity.target.content] === undefined){
	// 	LIBRARY[entity.source.content][entity.target.content] = new Set();
	// }
	// LIBRARY[entity.source.content][entity.target.content].add(entity.relation.type);
	if(entity.target.length > 1){
		addCompoundRelation({
			source: LIBRARY[sourceNode.content].varName,
			targets: entity.target,
			relation: entity.relation.type
		})
	}
	addRelation({
		source: LIBRARY[sourceNode.content].varName,
		target: LIBRARY[_.first(entity.target).content].varName,
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

function addRelation(options){
	var relationType = lib.relationToType(options.relation);
	if(relationType === 'c'){
		var customName = createCustomRelation(options.relation);
	}
	var relationName = variables.newVariable();
	add('struct Link '+relationName+';\n');
	add(relationName+'.source = &'+options.source+';\n');
	add(relationName+'.target = &'+options.target+';\n');
	add(relationName+'.relation = \''+relationType+'\';\n');
	if(customName !== undefined){
		add(relationName+'.custom = &'+customName+';\n');
		add('add_incoming_link(&'+customName+', &'+relationName+');\n');
		LIBRARY[options.relation] = LIBRARY[options.relation] || {};
		LIBRARY[options.relation].link = customName;
	console.log(options.source, options.target, options.relation, relationName);
	}
	LIBRARY[options.source] = LIBRARY[options.source] || {};
	LIBRARY[options.source][options.target] = LIBRARY[options.source][options.target] || {};
	LIBRARY[options.source][options.target][options.relation] = relationName;
	add('add_outgoing_link(&'+options.source+', &'+relationName+');\n');
	add('add_incoming_link(&'+options.target+', &'+relationName+');\n');
};

function addCompoundRelation(options){
	var hubName = createHubNode(options.targets);
	var relationName = variables.newVariable();
	add('struct Link '+relationName+';\n');
	add(relationName+'.source = &'+options.source+';\n');
	add(relationName+'.target = &'+hubName+';\n');
	add(relationName+'.relation = \'m\';\n');

	add(relationName+'.custom = &'+hubName+';\n');
	// add('add_outgoing_link(&'+hubName+', &'+relationName+');\n');

	add('add_outgoing_link(&'+options.source+', &'+relationName+');\n');
	add('add_incoming_link(&'+hubName+', &'+relationName+');\n');
};

function createHubNode(targets){
	var hubName = variables.newVariable();
	add('struct Node '+hubName+';\n');
	add(hubName+'.outgoing_len = 0;\n');
	add(hubName+'.incoming_len = 0;\n');
	add(hubName+'.outgoing = (struct Link *) malloc(sizeof(struct Link));\n');
	add(hubName+'.incoming = (struct Link *) malloc(sizeof(struct Link));\n');
	add(hubName+'.type = \'h\';\n');
	var varName;
	_.forEach(targets, function(targetNode){
		varName = LIBRARY[targetNode.content].varName;
		addRelation({source: hubName, target: varName, relation: '->'});
	})
	return hubName;
};

function createCustomRelation(type){
	if(LIBRARY[type] !== undefined){
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