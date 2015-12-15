var r = require('rethinkdb');
var _ = require('lodash');

function outgoingSimple(source, self, cb){
	getAll(self, [source], 'data', function(err, result){
		if(!result.length){ return cb([]); }
		
		var record = result[0];
		if(!record.out.length){ return cb([]); }

		getAll(self, record.out, null, function(err, results){

			results = _.map(results, function(item){
				return item.data
			})
			cb(results)

		})
	})
}

function _outgoingCustom(source, self, cb){

	getAll(self, [source], 'data', function(err, source){
		var source = source[0];
		if(!source.customOut.length){ return cb([]); }

		getAll(self, source.customOut, null, function(err, links){

			var items = _.map(links, function(item){ return {id: item.id, data: item.data } });
			var targetIDs = _.map(links, function(item){ return item.mapOut[source.id] });
			targetIDs = _.flatten(targetIDs);
			if(!targetIDs.length){ return cb([]); }

			getAll(self, targetIDs, null, function(err, targets){
				var result = {};

				_.map(targets, function(target, i){
					var parent = _.filter(items, function(item){
						return _.contains(target.customIn, item.id);
					})
					parent = parent[0];
					result[parent.data] = result[parent.data] || [];
					result[parent.data].push(target.data);
				})

				cb(result);
			})
		})
	})
}

function _incomingCustom(target, self, cb){

	getAll(self, [target], 'data', function(err, target){
		var target = target[0];
		if(!target.customIn.length){ cb([]); }

		getAll(self, target.customIn, null, function(err, links){

			var items = _.map(links, function(item){ return {id: item.id, data: item.data } });
			var targetIDs = _.map(links, function(item){ return item.mapIn[target.id] });
			targetIDs = _.flatten(targetIDs);
			if(!targetIDs.length){ return cb([]); }

			getAll(self, targetIDs, null, function(err, sources){
				var result = {};
				
				_.map(sources, function(source, i){
					var parent = _.filter(items, function(item){
						return _.contains(source.customOut, item.id);
					})
					parent = parent[0];
					result[parent.data] = result[parent.data] || [];
					result[parent.data].push(source.data);
				})

				cb(result);
			})
		})
	})
}

function incomingSimple(target, self, cb){
	getAll(self, [target], 'data', function(err, result){

		if(!result.length){ return cb([]); }
		
		var record = result[0];
		if(!record.in.length){ return cb([]); }
		
		getAll(self, record.in, null, function(err, results){

			results = _.map(results, function(item){
				return item.data
			})
			cb(results);

		})
	})
}

function customOutgoing(source, link, self, cb){
	getAll(self, [source, link], 'data', function(err, result){
		if(err || result.length < 2){ cb([]); }
		var source = _.findWhere(result, {data: source});
		var link =   _.findWhere(result, {data: link});
		getAll(self, link.mapOut[source.id], null, function(err, result){
			cb(result);
		})
	})
}

function customIncoming(target, link, self, cb){
	getAll(self, [target, link], 'data', function(err, result){
		if(err || result.length < 2){ cb([]); }
		var target = _.findWhere(result, {data: target});
		var link =   _.findWhere(result, {data: link});

		getAll(self, link.mapIn[target.id], null, function(err, result){
			result = _.map(result, function(item){
				return item.data;
			})
			cb(result);
		})
	})
}

function checkCustomRelation(query, self, cb){
	getAll(self, query, 'data', function(err, result){
		if(result.length < 3){ return cb(null); }

		var source = _.findWhere(result, { data: query[0] });
		var link =   _.findWhere(result, { data: query[1] });
		var target = _.findWhere(result, { data: query[2] });
		var hasRelation = _.contains(link.mapOut[source.id], target.id);
		cb(hasRelation);
	})
}

function checkSimpleRelation(query, self, cb){
	getAll(self, query, 'data', function(err, result){
		if(result.length < 2){ return cb(null); }
		
		var source = _.findWhere(result, { data: query[0] });
		var target = _.findWhere(result, { data: query[1] });

		var hasRelation = _.contains(source.out, target.id);
		cb(hasRelation);
	})
}

function allOutgoing(source, self, cb){
	var counter = 0, finalResult = {};

	outgoingSimple(source, self, _.partial(collectResults, 'simple'));
	_outgoingCustom(source, self, _.partial(collectResults, 'custom'));

	function collectResults(type, results){
		if(type === 'custom'){
			finalResult['custom'] = results;
			counter++;
		} else if(type === 'simple'){
			finalResult['simple'] = results;
			counter++;
		}
		if(counter === 2){
			cb(finalResult);
		}
	}
}

function allIncoming(target, self, cb){
	var counter = 0, finalResult = {};

	incomingSimple(target, self, _.partial(collectResults, 'simple'));
	_incomingCustom(target, self, _.partial(collectResults, 'custom'));

	function collectResults(type, results){
		if(type === 'custom'){
			finalResult['custom'] = results;
			counter++;
		} else if(type === 'simple'){
			finalResult['simple'] = results;
			counter++;
		}
		if(counter === 2){
			cb(finalResult);
		}
	}
}

function getAll(self, ids, index, cb){
	if(index !== null){
		r.connect(self.connection).then(function(conn){
			return r.table('data').getAll(r.args(ids), {index: index}).run(conn);
		}).then(function(cursor){
			cursor.toArray(cb);
		})
	} else {
		r.connect(self.connection).then(function(conn){
			return r.table('data').getAll(r.args(ids)).run(conn);
		}).then(function(cursor){
			cursor.toArray(cb);
		})
	}

}

module.exports = {
	allOutgoing: allOutgoing,
	allIncoming: allIncoming,
	customOutgoing: customOutgoing,
	customIncoming: customIncoming,
	outgoingSimple: outgoingSimple,
	incomingSimple: incomingSimple,
	checkSimpleRelation: checkSimpleRelation,
	checkCustomRelation: checkCustomRelation
}