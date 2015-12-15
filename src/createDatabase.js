var r = require('rethinkdb');

function createDatabase(name){
	r.connect({host: 'localhost', port: 28015}).then(function(conn){
		return r.dbCreate(name).run(conn)
	}).then(function(){
		r.connect({host: 'localhost', port: 28015, db: name}).then(function(conn){
			return r.tableCreate('data').run(conn);
		}).then(function(){
			r.connect({host: 'localhost', port: 28015, db: name}).then(function(conn){
				return r.table('data').insert({id: 0, count: 0}).run(conn);
			}).then(function(){
				constructIndex(name);
			})
		})
	})
}

function constructIndex(name){
	r.connect({host: 'localhost', port: 28015, db: name}).then(function(conn){
		return r.table('data').indexCreate('data').run(conn);
	}).then(function(){
		console.log('Database creation complete.')
	});
}

module.exports = createDatabase;