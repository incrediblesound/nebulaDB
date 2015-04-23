var fs = require('fs');
/*
//entry
<:0:>
<>blah_blah<>123,456,012<>432,654,120<>
			//incoming    //outgoing
<:1:>
<>c|e<>123<>321<>5|-1<>
//type //in//out//data
*/
NODE_OUTGOING = 3;
NODE_INCOMING = 2;
NODE_NAME = 1;
LINK_TYPE = 1;
LINK_OUTGOING = 3;
LINK_INCOMING = 2;
LINK_CUSTOM = 4;
var fetchEntry = function(index, name){
	index = parseInt(index);
	var page = getPage(index);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[(index % ((page > 0 ? page : 1)*1000) )+1].split('<>'); //[ '\n<:1:>\n', 'james', '', '0', '\n' ]
	return entry;
}

var checkSimpleRelation = function(query, library){
	var souceIndex, targetIndex, relationIndex;
	var sourceData, relNode, result = false;
	var outgoing;
	sourceIndex = library.nodes[query[0]];
	targetIndex = library.nodes[query[2]];
	relationIndex = library.nodes[query[1]];
	var sourceData = fetchEntry(sourceIndex, library.name);
	var idxArray = sourceData[ NODE_OUTGOING ].split(',');
	forEach(idxArray, function(index){
		if(isNumber(index)){
			relNode = fetchEntry(index, library.name);
			if(relNode[ LINK_TYPE ] === 'e'){
				outgoing = relNode[ LINK_OUTGOING ];
				if(outgoing = targetIndex.toString()){
					result = true;
				}
			}
		}
	})
	return result;
}

var checkCustomRelation = function(query, library){
	var souceIndex, targetIndex, relationIndex;
	var sourceData, relNode, result = false;
	var custom, target;
	sourceIndex = library.nodes[query[0]];
	targetIndex = library.nodes[query[2]];
	relationIndex = library.nodes[query[1]];
	var sourceData = fetchEntry(sourceIndex, library.name);
	var idxArray = sourceData[ NODE_OUTGOING ].split(',');
	forEach(idxArray, function(index){
		if(isNumber(index)){
			relNode = fetchEntry(index, library.name);
			if(relNode[ LINK_TYPE ] === 'c'){
				custom = relNode[ LINK_CUSTOM ];
				target = relNode[ LINK_OUTGOING ];
				if(custom === relationIndex.toString() &&
				   target === targetIndex.toString()){
					result = true;
				}
			}
		}
	})
	return result;
}

var allOutgoing = function(sourceName, library){
	var result = {}, link, entry, custom;
	var sourceIndex = library.nodes[ sourceName ]
	var sourceData = fetchEntry(sourceIndex, library.name);
	var indexArray = sourceData[ NODE_OUTGOING ].split(',');
	forEach(indexArray, function(outgoingIndex){
		link = fetchEntry(outgoingIndex, library.name);
		if(link[ LINK_TYPE ] === 'e'){
			entry = fetchEntry(link[ LINK_OUTGOING ], library.name);
			result['simpleStates'] = result['simpleStates'] || [];
			result['simpleStates'].push(entry[ NODE_NAME ]);
		}
		else if(link[ LINK_TYPE ] === 'c'){
			entry = fetchEntry(link[ LINK_OUTGOING ], library.name);
			custom = fetchEntry(link[ LINK_CUSTOM ], library.name);
			result[custom[ NODE_NAME ]] = result[custom[ NODE_NAME ]] || [];
			result[custom[ NODE_NAME ]].push(entry[ NODE_NAME ]);
		}
	})
	return result;
}

var allIncoming = function(targetName, library){
	var result = {}, link, entry, custom;
	var targetIndex = library.nodes[ targetName ]
	var targetData = fetchEntry(targetIndex, library.name);
	var indexArray = targetData[ NODE_INCOMING ].split(',');
	forEach(indexArray, function(sourceIndex){
		link = fetchEntry(sourceIndex, library.name);
		if(link[ LINK_TYPE ] === 'e'){
			entry = fetchEntry(link[ LINK_INCOMING ], library.name);
			result['simpleStates'] = result['simpleStates'] || [];
			result['simpleStates'].push(entry[ NODE_NAME ]);
		}
		else if(link[ LINK_TYPE ] === 'c'){
			entry = fetchEntry(link[ LINK_INCOMING ], library.name);
			custom = fetchEntry(link[ LINK_CUSTOM ], library.name);
			result[custom[ NODE_NAME ]] = result[custom[ NODE_NAME ]] || [];
			result[custom[ NODE_NAME ]].push(entry[ NODE_NAME ]);
		}
	})
	return result;
}

var customOutgoing = function(sourceName, customName, library){
	var result = {}, link, entry, custom;
	result[ customName ] = [];
	var sourceIndex = library.nodes[ sourceName ]
	var sourceData = fetchEntry(sourceIndex, library.name);
	var indexArray = sourceData[ NODE_OUTGOING ].split(',');
	forEach(indexArray, function(outgoingIndex){
		link = fetchEntry(outgoingIndex, library.name);
		if(link[ LINK_TYPE ] === 'c'){
			entry = fetchEntry(link[ LINK_OUTGOING ], library.name);
			custom = fetchEntry(link[ LINK_CUSTOM ], library.name);
			if(custom[ NODE_NAME ] === customName){
				result[ customName ].push(entry[ NODE_NAME ]);
			}
		}
	})
	return result;
};

var customIncoming = function(targetName, customName, library){
	var result = {}, link, entry, custom;
	result[ customName ] = [];
	var targetIndex = library.nodes[ targetName ]
	var targetData = fetchEntry(targetIndex, library.name);
	var indexArray = targetData[ NODE_INCOMING ].split(',');
	forEach(indexArray, function(incomingIndex){
		link = fetchEntry(incomingIndex, library.name);
		if(link[ LINK_TYPE ] === 'c'){
			entry = fetchEntry(link[ LINK_INCOMING ], library.name);
			custom = fetchEntry(link[ LINK_CUSTOM ], library.name);
			if(custom[ NODE_NAME ] === customName){
				result[ customName ].push(entry[ NODE_NAME ]);
			}
		}
	})
	return result;
};

var outgoingSimple = function(sourceName, library){
	var result = {}, link, entry, custom;
	result[ 'simpleStates'] = [];
	var sourceIndex = library.nodes[ sourceName ]
	var sourceData = fetchEntry(sourceIndex, library.name);
	var indexArray = sourceData[ NODE_OUTGOING ].split(',');
	forEach(indexArray, function(outgoingIndex){
		link = fetchEntry(outgoingIndex, library.name);
		if(link[ LINK_TYPE ] === 'e'){
			entry = fetchEntry(link[ LINK_OUTGOING ], library.name);
			result['simpleStates'].push(entry[ NODE_NAME ]);
		}
	})
	return result;
};

var incomingSimple = function(targetName, library){
	var result = {}, link, entry, custom;
	result[ 'simpleStates'] = [];
	var targetIndex = library.nodes[ targetName ]
	var targetData = fetchEntry(targetIndex, library.name);
	var indexArray = targetData[ NODE_INCOMING ].split(',');
	forEach(indexArray, function(incomingIndex){
		link = fetchEntry(incomingIndex, library.name);
		if(link[ LINK_TYPE ] === 'e'){
			entry = fetchEntry(link[ LINK_INCOMING ], library.name);
			result['simpleStates'].push(entry[ NODE_NAME ]);
		}
	})
	return result;
};

var removeLink = function(query, library){
	var sourceIndex, targetIndex, relationIndex;
	if(query[1] === '->'){
		relationIndex = getLinkIndex(query, library);
	} else {
		relationIndex = getCustomLinkIndex(query, library);
	}
	sourceIndex = library.nodes[query[0]];
	targetIndex = library.nodes[query[2]];
	removeOutgoing(sourceIndex, relationIndex, library.name);
	removeIncoming(relationIndex, sourceIndex, library.name);
	removeOutgoing(relationIndex, targetIndex, library.name);
	removeIncoming(targetIndex, relationIndex, library.name);
}

var addOutgoing = function(updateIndex, outgoingIndex, name){
	updateIndex = parseInt(updateIndex);
	var page = getPage(updateIndex);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[(updateIndex % ((page > 0 ? page : 1)*1000) )+1].split('<>'); //[ '\n<:1:>\n', 'james', '', '0', '\n' ]
	if(entry[ NODE_OUTGOING ].length){
		entry[ NODE_OUTGOING ] += ','+outgoingIndex;
	} else {
		entry[ NODE_OUTGOING ] += outgoingIndex;
	}
	entry = entry.join('<>');
	file[(updateIndex % ((page > 0 ? page : 1)*1000) )+1] = entry;
	file = file.join('//entry');
	fs.writeFileSync('./data/'+name+'_'+page+'.neb', file);
};

var addIncoming = function(updateIndex, incomingIndex, name){
	updateIndex = parseInt(updateIndex);
	var page = getPage(updateIndex);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[(updateIndex % ((page > 0 ? page : 1)*1000) )+1].split('<>');
	if(entry[ NODE_INCOMING ].length){
		entry[ NODE_INCOMING ] += ','+incomingIndex;
	} else {
		entry[ NODE_INCOMING ] += incomingIndex;
	}
	entry = entry.join('<>');
	file[(updateIndex % ((page > 0 ? page : 1)*1000) )+1] = entry;
	file = file.join('//entry');
	fs.writeFileSync('./data/'+name+'_'+page+'.neb', file);
};

var removeOutgoing = function(sourceIndex, outgoingIndex, name){
	var page = getPage(sourceIndex);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[(sourceIndex % ((page > 0 ? page : 1)*1000) )+1].split('<>');
	var outgoing = entry[ NODE_OUTGOING ].split(',');
	outgoing = removeFromArray(outgoing, ''+outgoingIndex);
	entry[ NODE_OUTGOING ] = outgoing.join(',');
	entry = entry.join('<>');
	file[(sourceIndex % ((page > 0 ? page : 1)*1000) )+1] = entry;
	file = file.join('//entry');
	fs.writeFileSync('./data/'+name+'_'+page+'.neb', file);
}

var removeIncoming = function(sourceIndex, incomingIndex, name){
	var page = getPage(sourceIndex);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[(sourceIndex % ((page > 0 ? page : 1)*1000) )+1].split('<>'); //[ '\n<:1:>\n', 'james', '', '0', '\n' ]
	var incoming = entry[ NODE_INCOMING ].split(',');
	incoming = removeFromArray(incoming, ''+incomingIndex);
	entry[ NODE_INCOMING ] = incoming.join(',');
	entry = entry.join('<>');
	file[(sourceIndex % ((page > 0 ? page : 1)*1000) )+1] = entry;
	file = file.join('//entry');
	fs.writeFileSync('./data/'+name+'_'+page+'.neb', file);
}

var getLinkIndex = function(query, library){
	var sourceIndex, targetIndex, relationIndex, outgoingNode;
	var result;
	sourceIndex = library.nodes[query[0]];
	targetIndex = library.nodes[query[2]];
	relationIndex = library.nodes[query[1]];
	sourceData = fetchEntry(sourceIndex, library.name);
	// this should jump out of the loop once the index is found
	forEach(sourceData[ NODE_OUTGOING ], function(outgoingIndex){
		var outgoingNode = fetchEntry(outgoingIndex, library.name);
		if(outgoingNode[ LINK_OUTGOING ] === ''+targetIndex){
			result = outgoingIndex;
		}
	})
	return result;
}

var getCustomLinkIndex = function(query, library){
	var sourceIndex, targetIndex, relationIndex, outgoingNode;
	var result;
	sourceIndex = library.nodes[query[0]];
	targetIndex = library.nodes[query[2]];
	relationIndex = library.nodes[query[1]];
	sourceData = fetchEntry(sourceIndex, library.name);
	// this should jump out of the loop once the index is found
	forEach(sourceData[ NODE_OUTGOING ], function(outgoingIndex){
		var outgoingNode = fetchEntry(outgoingIndex, library.name);
		if(outgoingNode[ LINK_TYPE ] === 'c'){
			if(outgoingNode[ LINK_OUTGOING ] === ''+targetIndex &&
			   outgoingNode[ LINK_CUSTOM ] === ''+relationIndex){
				result = outgoingIndex;
			}
		}
	})
	return result;
}

var writeEntry = function(query, index, library, cb){
	var sourceBody, targetBody, relationBody, customRelation;
	var sourceIndex = library.nodes[query[0]];
	var targetIndex = library.nodes[query[2]];
	var relationIndex;
	if(query[1] !== '->'){
		relationIndex = library.nodes[query[1]];
		if(relationIndex === undefined){
			customRelation = createEntry(query[1], index)
			index++
			relationBody = createLink(index, true, customRelation.index);
			library.nodes[query[1]] = customRelation.index;
			relationIndex = relationBody.index;
		} else {
			relationBody = createLink(index, true, relationIndex);
			relationIndex = relationBody.index;
		}
	} else {
		relationBody = createLink(index, false);
		relationIndex = relationBody.index;
	}
	index++;
	if(sourceIndex === undefined){
		sourceBody = createEntry(query[0], index);
		index++;
		sourceIndex = sourceBody.index;
		library.nodes[query[0]] = sourceIndex;
	}
	if(targetIndex === undefined){
		targetBody = createEntry(query[2], index);
		index++;
		targetIndex = targetBody.index;
		library.nodes[query[2]] = targetIndex;
	}
	if(sourceBody === undefined){
		addOutgoing(sourceIndex, relationIndex, library.name);
	} else {
		sourceBody.outgoing.push(relationIndex);
	}
	if(targetBody === undefined){
		addIncoming(targetIndex, relationIndex, library.name);
	} else {
		targetBody.incoming.push(relationIndex);
	}
	relationBody.outgoing.push(targetIndex);
	relationBody.incoming.push(sourceIndex);
	recordEntries([customRelation, relationBody, sourceBody, targetBody], library.name);
	cb(index);
}

var recordEntries = function(array, name){
	var page;
	for(var i = 0; i < 4; i++){
		var current = array[i];
		if(current !== undefined){
			var page = getPage(current.index);
			var body = '//entry\n'+current.head+current.name+current.incoming.toString()+'<>'+current.outgoing.toString()+'<>';
			if(current.data !== undefined){
				body += (''+current.data+'<>');
			}
			body += '\n';
			fs.appendFileSync('./data/'+name+'_'+page+'.neb', body);
		}
	}
};

var createEntry = function(name, index){
	var head = '<:'+index+':>\n';
	var body = { head: head, 
				  name: '<>'+name+'<>', 
				  incoming: [], 
				  outgoing: [],
				  index: index,
				};
	return body;
};

var createLink = function(index, custom, customIndex){
	var head = '<:'+index+':>\n';
	var body = { head: head,
				 name: '<>'+ (custom ? 'c' : 'e') + '<>',
				 incoming: [],
				 outgoing: [],
				 index: index,
			   }
	if(custom){
		body.data = customIndex;
	} else {
		body.data = '-1';
	}
	return body;
};

function getPage(index){
	index = index > 0 ? index : 1;
	return Math.floor(index/1000);
};

function forEach(arr, fn){
	for(var i = 0, l = arr.length; i < l; i++){
		fn(arr[i], i);
	}
};

function removeFromArray(array, item){
	var result = [];
	forEach(array, function(element){
		if(element !== item){
			result.push(element);
		}
	})
	return result;
}

function isNumber(el){
	return (parseInt(el) === parseInt(el));
};

module.exports = {
	writeEntry: writeEntry,
	fetchEntry: fetchEntry,
	checkSimpleRelation: checkSimpleRelation,
	checkCustomRelation: checkCustomRelation,
	allOutgoing: allOutgoing,
	customOutgoing: customOutgoing,
	outgoingSimple: outgoingSimple,
	allIncoming: allIncoming,
	customIncoming: customIncoming,
	incomingSimple: incomingSimple,
	removeLink: removeLink
};