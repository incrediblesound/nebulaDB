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
	this.library = { nodes: {} };
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
	record.removeLink(query, this.library);
	this.busy = false;
}

DB.prototype.removeLink = function(query){
	this.stack.push([query, null, 'r'])
}

DB.prototype.process_query = function(query, cb){
	query = lexer(query);
	var self = this;
	var result;
	this.busy = true;
	if(query[0] === '*'){
		if(query[1] === '*'){
			result = record.allIncoming(query[2], this.library);
		}
		else if(query[1] !== '->'){
			result = record.customIncoming(query[2], query[1], this.library);
		} else {
			result = record.incomingSimple(query[2], this.library);
		}
		if(result instanceof Error){
			cb(result, null);
		} else {
			cb(null, result);
		}
		this.busy = false;
		return;
	}
	else if(query[2] === '*'){
		if(query[1] === '*'){
			result = record.allOutgoing(query[0], this.library);
		}
		else if(query[1] !== '->'){
			result = record.customOutgoing(query[0], query[1], this.library);	
		} else {
			result = record.outgoingSimple(query[0], this.library);
		}
		if(result instanceof Error){
			cb(result, null);
		} else {
			cb(null, result);
		}
		this.busy = false;
		return;
	}
	else if(query[1] !== '->'){
		result = record.checkCustomRelation(query, this.library);
	} else {
		result = record.checkSimpleRelation(query, this.library);
	}
	if(result instanceof Error){
		cb(result, null);
	} else {
		cb(null, result);
	}
	this.busy = false;
}

DB.prototype.start = function(){
	var self = this;
	this.interval = setInterval(function(){
		if(self.stack.length && !self.busy){
			var data = self.stack.shift();
			if(data[2] === 'q'){
				self.process_query(data[0], data[1])
			} 
			else if(data[2] === 's') {
				self.process_save(data[0]);
			}
			else if(data[2] === 'r') {
				self.process_removeLink(data[0]);
			}
		}
	}, 10)
}

DB.prototype.stop = function(){
	clearInterval(this.interval);
};
DB.prototype.lazyStop = function(){
	while(this.stack.length){}
	this.stop();
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
