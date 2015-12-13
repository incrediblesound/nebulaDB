var r = require('rethinkdb');
var _ = require('lodash');

function outgoingSimple(source, self, cb){
	r.connect(self.connection).then(function(conn){
		return r.table('data').getAll(source, {index: 'data'}).run(conn);
	}).then(function(cursor){
		cursor.toArray(function(err, result){
			if(err || !result.length){ cb([]); }
			
			var record = result[0];
			r.connect(self.connection).then(function(conn){
				return r.table('data').getAll(r.args(record.out)).run(conn);
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

function _outgoingCustom(source, self, cb){
	r.connect(self.connection).then(function(conn){
		return r.table('data').getAll(source, {index: 'data'}).run(conn);
	}).then(function(cursor){
		cursor.toArray(function(err, source){
			if(err || !source.length){ cb([]); }
			var source = source[0];
			r.connect(self.connection).then(function(conn){
				return r.table('data').getAll(r.args(source.customOut)).run(conn);
			}).then(function(cursor){
				cursor.toArray(function(err, links){
					var names = _.map(links, function(item){ return item.data });
					var targetIDs = _.map(links, function(item){ return item.mapOut[source.id] });
					r.connect(self.connection).then(function(conn){
						return r.table('data').getAll(r.args(targetIDs)).run(conn);
					}).then(function(cursor){
						cursor.toArray(function(err, targets){
							var result = {};
							_.map(targets, function(item, i){
								result[names[i]] = item.data;
							})
							cb(result);
						})
					})
				})
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

module.exports = {
	allOutgoing: allOutgoing,
	customOutgoing: customOutgoing,
	outgoingSimple: outgoingSimple,
	incomingSimple: incomingSimple
}