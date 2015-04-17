var _ = require('./lib/helpers.js');
var variables = require('./lib/variables.js')();
var Set = require('./lib/set.js').Set;
var fs = require('fs');
var lib = require('./lib/lib.js');
var exec = require('child_process').exec;

LIBRARY = {};
var result = '';
var queries = '';
var add = function(string){
	result += string;
};

module.exports = {
	loadLibrary: function(data){
		LIBRARY = data;
	},
	compile: function(stack){
		result = '';
		_.forEach(stack, function(entity, idx){
			if(entity.query === true){
				createQuery(entity, idx);
			} else {
				createEntities(entity);
			}
		})
		return { code: result, library: LIBRARY };
		// var output = '#include \"core.h\"\n\nint main(){\n'+result+';\n'+queries+'\n};\n';
	}	
}

function createQuery(entity, idx){
	var sourceNode, targetNode, sourceVarName, relationFunction, 
		linkName, targetVarName;
	targetNode = _.first(entity.target);
	sourceNode = _.first(entity.source);
	if(sourceNode.content === '*'){
		if(LIBRARY[targetNode.content] === undefined){
			add('printf("{\\"Node not found\\": \\"'+targetNode.content+'\\"}");');
			return;
		}
		targetVarName = LIBRARY[targetNode.content].varName
		if(entity.relation.type === '*'){
			add('all_incoming_relations(&'+targetVarName+');\n');
			return;
		}
		else if(entity.relation.type === '->'){
			add('all_incoming_targets(&'+targetVarName+');\n');
			return;
		} else {
			linkName = LIBRARY[entity.relation.type].varName;
			add('incoming_custom_target(&'+targetVarName+', &'+linkName+');\n')
			return;
		}
	}
	else if(LIBRARY[sourceNode.content] === undefined){
		add('printf("{\\"Node not found\\": \\"'+sourceNode.content+'\\"}");');
		return;
	}
	sourceVarName = LIBRARY[sourceNode.content].varName;
	if(targetNode.content === '*' && entity.relation.type === '*'){
		add('all_relations(&'+sourceVarName+');\n');
		return;
	}
	else if(targetNode.content === '*'){
		if(entity.relation.type === '->'){
			add('all_outgoing_targets(&'+sourceVarName+');\n');
		} else {
			linkName = LIBRARY[entity.relation.type].varName;
			add('custom_target(&'+sourceVarName+', &'+linkName+');\n');
		}
	} else {
		if(LIBRARY[targetNode.content] === undefined){
			add('printf("{\\"Node not found\\": \\"'+targetNode.content+'\\"}");');
			return;
		}
		targetVarName = LIBRARY[targetNode.content].varName
		relationFunction = lib.relationToFunc[entity.relation.type];
		if(relationFunction !== undefined){
			add(relationFunction+'(');
			add('&'+LIBRARY[sourceNode.content].varName+', &');
			add(LIBRARY[targetNode.content].varName+');\n');
		} else {
			linkName = LIBRARY[entity.relation.type].varName;
			add('custom_relation(');
			add('&'+linkName+', &');
			add(sourceVarName+', &');
			add(targetVarName+');\n');
		}
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
	if(LIBRARY[options.source] !== undefined &&
	   LIBRARY[options.source][options.target] !== undefined &&
	   LIBRARY[options.source][options.target][options.relation] !== undefined){
		return;
	}
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
	}
	LIBRARY[options.source] = LIBRARY[options.source] || {};
	LIBRARY[options.target] = LIBRARY[options.target] || {};
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