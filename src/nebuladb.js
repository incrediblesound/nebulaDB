var r = require('rethinkdb');
var _ = require('lodash');
_ = _.extend(_, require('./lib/helpers.js'));
var write = require('./write.js');
var read = require('./read.js');
var DB = function(){
	this.index = 1;
	this.stack = [];
	this.busy = false;
	this.interval;
};

DB.prototype.init = function(name, cb){
	this.connection = {host: 'localhost', port: 28015, db: name};
	var self = this;
	return r.connect(this.connection).then(function(conn){
		return r.table('data').get(0).run(conn);
	}).then(function(result){
		this.index = result.count;
		return cb();
	})
}

DB.prototype.process_save = function(query, cb){
	this.busy = true;
	write.writeEntry(query, this, _.bind(function(err){
		this.busy = false;
	}, this))
}

DB.prototype.save = function(query){
	this.stack.push([query, null, 's'])
}

DB.prototype.saveAll = function(array){
	var self = this;
	_.forEach(array, function(query){
		self.save(query);
	})
}

DB.prototype.query = function(query, cb){
	this.stack.push([query, cb, 'q']);
}

DB.prototype.process_removeLink = function(query){
	query = lexer(query);
	this.busy = true;
	record.removeLink(query, this);
	this.busy = false;
}

DB.prototype.removeLink = function(query){
	this.stack.push([query, null, 'r'])
}

DB.prototype.process_query = function(query, cb){
	var self = this;
	var result;
	this.busy = true;
	if(query[0] === '*'){
		if(query[1] === '*'){
			read.allIncoming(query[2], this, _.partial(this.returnResult, this, cb));
		}
		else if(query[1] !== '->'){
			read.customIncoming(query[2], query[1], this).then(_.partial(this.returnResult, this, cb));
		} else {
			read.incomingSimple(query[2], this, _.partial(this.returnResult, this, cb));
		}
	}
	else if(query[2] === '*'){
		if(query[1] === '*'){
			read.allOutgoing(query[0], this, _.partial(this.returnResult, this, cb));
		}
		else if(query[1] !== '->'){
			read.customOutgoing(query[0], query[1], this, _.partial(this.returnResult, this, cb))	
		} else {
			read.outgoingSimple(query[0], this, _.partial(this.returnResult, this, cb));
		}
	}
	else if(query[1] !== '->'){
		read.checkCustomRelation(query, this).then(_.partial(this.returnResult, this, cb));
	} else {
		read.checkSimpleRelation(query, this).then(_.partial(this.returnResult, this, cb));
	}
}

DB.prototype.returnResult = function(self, cb, result){
	self.busy = false;
	cb(result);
}

DB.prototype.start = function(){
	var self = this;
	this.interval = setInterval(function(){
		if(self.stack.length && !self.busy){
			var data = self.stack.shift();
			var type = data[2];
			var cb = data[1];
			var query = _.splitQuery(data[0]);

			if(type === 'q'){
				self.process_query(query, cb)
			} 
			else if(type === 's') {
				self.process_save(query);
			}
			else if(type === 'r') {
				self.process_removeLink(query);
			}
		}
	}, 0)
}

DB.prototype.hardStop = function(){
	clearInterval(this.interval);
};
DB.prototype.stop = function(){
	var self = this;
	if(this.stack.length){
		setTimeout(function(){
			self.stop();
		}, 0)
	} else {
		this.hardStop();
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
