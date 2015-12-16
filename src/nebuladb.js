var r = require('rethinkdb');
var _ = require('lodash');
_ = _.extend(_, require('./lib/helpers.js'));
var write = require('./write.js');
var read = require('./read.js');

var DB = function(){
	this.index = 1;
	this.interval;
};

DB.prototype.init = function(name, cb){
	this.connection = {host: 'localhost', port: 28015, db: name};
	var self = this;
	return r.connect(this.connection).then(function(conn){
		return r.table('data').get(0).run(conn);
	}).then(function(result){
		self.index = result.count;
		return cb();
	})
}

DB.prototype.save = function(query){
	var query = _.splitQuery(query);
	write.writeEntry(query, this);
}

DB.prototype.saveAll = function(array){
	var self = this;
	_.forEach(array, function(query){
		self.save(query);
	})
}

DB.prototype.query = function(query, cb){
	var query = _.splitQuery(query);
	this.process_query(query, cb);
}

DB.prototype.removeLink = function(query){
	var query = _.splitQuery(query);
	record.removeLink(query, this);
}

DB.prototype.process_query = function(query, cb){
	if(query[0] === '*'){
		if(query[1] === '*'){
			read.allIncoming(query[2], this, cb);
		}
		else if(query[1] !== '->'){
			read.customIncoming(query[2], query[1], this, cb);
		} else {
			read.incomingSimple(query[2], this, cb);
		}
	}
	else if(query[2] === '*'){
		if(query[1] === '*'){
			read.allOutgoing(query[0], this, cb);
		}
		else if(query[1] !== '->'){
			read.customOutgoing(query[0], query[1], this, cb);	
		} else {
			read.outgoingSimple(query[0], this, cb);
		}
	}
	else if(query[1] !== '->'){
		read.checkCustomRelation(query, this, cb);
	} else {
		read.checkSimpleRelation([query[0],query[2]], this, cb);
	}
}

var nebuladb = {
	create: function(name, cb){
		var db = new DB();
		db.init(name, function(){
			cb(db);
		});
	}
};

module.exports = nebuladb;
