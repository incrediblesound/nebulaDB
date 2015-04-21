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
LINK_TYPE = 1;
LINK_OUTGOING = 3;
LINK_CUSTOM = 4;
var fetchEntry = function(index, name){
	index = parseInt(index);
	var page = getPage(index);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[index+1].split('<>'); //[ '\n<:1:>\n', 'james', '', '0', '\n' ]
	return entry;
}

var checkSimpleRelation = function(query, library){
	var souceIndex, targetIndex, relationIndex;
	var sourceData, relNode, result = false;
	var outgoing;
	sourceIndex = library[query[0]];
	targetIndex = library[query[2]];
	relationIndex = library[query[1]];
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
	sourceIndex = library[query[0]];
	targetIndex = library[query[2]];
	relationIndex = library[query[1]];
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

var addOutgoing = function(updateIndex, outgoingIndex, name){
	updateIndex = parseInt(updateIndex);
	var page = getPage(updateIndex);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[updateIndex+1].split('<>'); //[ '\n<:1:>\n', 'james', '', '0', '\n' ]
	if(entry[ NODE_OUTGOING ].length){
		entry[ NODE_OUTGOING ] += ','+outgoingIndex;
	} else {
		entry[ NODE_OUTGOING ] += outgoingIndex;
	}
	entry = entry.join('<>');
	file[updateIndex+1] = entry;
	file = file.join('//entry');
	fs.writeFileSync('./data/'+name+'_'+page+'.neb', file);
};

var addIncoming = function(updateIndex, incomingIndex, name){
	updateIndex = parseInt(updateIndex);
	var page = getPage(updateIndex);
	var buffer = fs.readFileSync('./data/'+name+'_'+page+'.neb');
	var file = buffer.toString(), entry;
	file = file.split('//entry');
	entry = file[updateIndex+1].split('<>'); //[ '\n<:1:>\n', 'james', '', '0', '\n' ]
	if(entry[ NODE_INCOMING ].length){
		entry[ NODE_INCOMING ] += ','+incomingIndex;
	} else {
		entry[ NODE_INCOMING ] += incomingIndex;
	}
	entry = entry.join('<>');
	file[updateIndex+1] = entry;
	file = file.join('//entry');
	fs.writeFileSync('./data/'+name+'_'+page+'.neb', file);
};

var writeEntry = function(query, index, library, cb){
	console.log(query);
	var sourceBody, targetBody, relationBody, customRelation;
	var sourceIndex = library[query[0]];
	var targetIndex = library[query[2]];
	var relationIndex;
	if(query[1] !== '->'){
		relationIndex = library[query[1]];
		if(relationIndex === undefined){
			customRelation = createEntry(query[1], index)
			index++
			relationBody = createLink(index, true, customRelation.index);
			library[query[1]] = customRelation.index;
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
		library[query[0]] = sourceIndex;
	}
	if(targetIndex === undefined){
		targetBody = createEntry(query[2], index);
		index++;
		targetIndex = targetBody.index;
		library[query[2]] = targetIndex;
	}
	if(sourceBody === undefined){
		addOutgoing(sourceIndex, relationIndex, library.name);
	} else {
		sourceBody.outgoing.push(relationIndex);
	}
	if(targetBody === undefined){
		addIncoming(targetIndex, sourceIndex, library.name);
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
	return Math.floor(index/1000);
};

function forEach(arr, fn){
	for(var i = 0, l = arr.length; i < l; i++){
		fn(arr[i], i);
	}
};

function isNumber(el){
	return (parseInt(el) === parseInt(el));
};

module.exports = {
	writeEntry: writeEntry,
	fetchEntry: fetchEntry,
	checkSimpleRelation: checkSimpleRelation,
	checkCustomRelation: checkCustomRelation
};