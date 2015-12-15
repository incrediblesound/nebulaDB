var r = require('rethinkdb');
var _ = require('lodash');

function outgoingSimple(source, self, cb){
	getAll(self, [source], 'data', function(err, result){
		if(err || !result.length){ return cb([]); }
		
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
		if(!source.customOut.length){ cb([]); }

		getAll(self, source.customOut, null, function(err, links){

			var items = _.map(links, function(item){ return {id: item.id, data: item.data } });
			var targetIDs = _.map(links, function(item){ return item.mapOut[source.id] });
			targetIDs = _.flatten(targetIDs);

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

function incomingSimple(target, self, cb){
	r.connect(self.connection).then(function(conn){
		return r.table('data').getAll(target, {index: 'data'}).run(conn);
	}).then(function(cursor){
		cursor.toArray(function(err, result){
			if(err || !result.length){ cb([]); }
			
			var record = result[0];
			return r.connect(self.connection).then(function(conn){
				return r.table('data').getAll(r.args(record.in)).run(conn);
			}).then(function(cursor){
				cursor.toArray(function(err, results){
					results = _.map(results, function(item){
						return item.data
					})
					cb(results)
				})
			})
		})
	})
}

function customOutgoing(source, link, self, cb){
	r.connect(self.connection).then(function(conn){
		return r.table('data').getAll(source, link, {index: 'data'}).run(conn);
	}).then(function(cursor){
		cursor.toArray(function(err, result){
			if(err || result.length < 2){ cb([]); }
			var source = result[0];
			var link = result[1];
			r.connect(self.connection).then(function(conn){
				return r.table('data').get(link.mapOut[source.id]).run(conn);
			}).then(function(result){
				cb(result.data);
			})
		})
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
	customOutgoing: customOutgoing,
	outgoingSimple: outgoingSimple,
	incomingSimple: incomingSimple
}