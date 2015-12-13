var r = require('rethinkdb');
var _ = require('lodash');

function outgoingSimple(source, self, cb){
	r.connect(self.connection).then(function(conn){
		r.table('data').getAll(source, {index: 'data'}).run(conn);
	}).then(function(cursor){
		cursor.toArray(function(err, result){
			if(err || !result.length){ cb([]); }
			
			var record = result[0];
			r.connect(self.connection).then(function(conn){
				r.table('data').getAll(r.args(record.out)).run(conn);
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

function incomingSimple(target, self, cb){
	r.connect(self.connection).then(function(conn){
		r.table('data').getAll(target, {index: 'data'}).run(conn);
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
	return r.connect(self.connection).then(function(conn){
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

module.exports = {
	customOutgoing: customOutgoing,
	outgoingSimple: outgoingSimple,
	incomingSimple: incomingSimple
}