var lexer = require('./lexer.js');
var _ = require('./lib/helpers.js')
var fs = require('fs');
var record = require('./record.js');
var exec = require('child_process').exec;

var DB = function(){
	this.size = 0;
	this.stack = [];
	this.busy = false;
	this.interval;
	this.library = {};
};

DB.prototype.init = function(options, cb){
	this.db = './data/'+options.db;
	this.tail = '\n};\n';
	var isFile = fs.existsSync(this.db+'_0.neb');

	if(!isFile){
		this.library.currentIndex = 0;
		this.library.currentPage = 0;
		this.library.name = options.db;
	} else {
		var lib = fs.readFileSync(this.db+'.json');
		lib = JSON.parse(lib);
		this.library = lib;
		// compiler.loadLibrary(lib);
	}
	cb();
}

DB.prototype.parse = function(query, cb){
	var stack, code, data, library;
	if(typeof query[0] === 'string'){
		stack = parser([query]);
	} else {
		stack = parser(query);
	}
	data = compiler.compile(stack);
	code = data.code;
	this.library = data.library;
	cb(code);
}

DB.prototype.process_save = function(query){
	query = lexer(query);
	this.busy = true;
	var self = this;
	record.writeEntry(query, 
					  this.library.currentIndex, 
					  this.library, function(index){
		self.library.currentIndex = index;
		fs.writeFileSync(self.db+'.json', JSON.stringify(self.library));
	});
	this.busy = false;
}

DB.prototype.save = function(query){
	this.stack.push([query, null, false])
}

DB.prototype.saveAll = function(array){
	var self = this;
	_.forEach(array, function(query){
		self.save(query);
	})
}

DB.prototype.query = function(query, cb){
	query = lexer(query);
	this.stack.push([query, cb, true]);
}

DB.prototype.process_query = function(query, cb){
	var self = this;
	this.busy = true;
	if(query[0] === '*'){

	}
	else if(query[2] === '*'){
		if(query[1] === '*'){
			var outgoing = record.allOutgoing(query[0], this.library);
			cb(outgoing);
			this.busy = false;
			return;
		}
	}
	else if(query[1] !== '->'){
		var hasRelation = record.checkCustomRelation(query, this.library);
	} else {
		var hasRelation = record.checkSimpleRelation(query, this.library);
	}
	cb(hasRelation);
	this.busy = false;
}

DB.prototype.start = function(){
	var self = this;
	this.interval = setInterval(function(){
		if(self.stack.length && !self.busy){
			var data = self.stack.shift();
			if(data[2]){
				self.process_query(data[0], data[1])
			} else {
				self.process_save(data[0]);
			}
		}
	}, 10)
}

var nebuladb = {
	create: function(name, cb){
		var db = new DB();
		db.init({ db: name }, function(){
			db.start();
			cb(db);
		});
	}
};

module.exports = nebuladb;
