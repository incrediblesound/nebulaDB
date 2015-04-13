var parser = require('./parser.js');
var _ = require('./lib/helpers.js')
var compiler = require('./compiler.js');
var fs = require('fs');
var exec = require('child_process').exec;

var DB = function(){
	this.size = 0;
	this.stack = [];
	this.busy = false;
	this.interval;
	this.library;
};

DB.prototype.init = function(options){
	this.db = options.db;
	this.tail = '\n};\n';
	if(options.isNew){
		fs.truncateSync(this.db+'.c',0);
		fs.writeFileSync(this.db+'.c', '#include \"src/core.h\"\n\nint main(){\n')
	} else {
		var lib = fs.readFileSync(this.db+'.json');
		lib = JSON.parse(lib);
		this.length = lib.DB_SIZE;
		compiler.loadLibrary(lib);
	}
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
	this.busy = true;
	var self = this;
	this.parse(query, function(code){
		fs.appendFile(self.db+'.c', code, function(){
			stats = fs.statSync(self.db+'.c')
			self.length = stats.size;
			self.busy = false;
		});
	})
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
	this.stack.push([query, cb, true]);
}

DB.prototype.process_query = function(query, cb){
	this.busy = true;
	var self = this;
	query.unshift('?');
	this.parse(query, function(code){
		fs.truncateSync(self.db+'.c', self.length);
		fs.appendFileSync(self.db+'.c', code+self.tail);
		exec('gcc '+self.db+'.c -o out', function(err){
			if(err) console.log('COMPILE ERROR: ', err);

			exec('./out', function(err, stdOut){
				var result;
				if(_.isNumber(stdOut)){
					var truthy = parseInt(stdOut);
					result = {hasState: truthy === 1 ? true : false}
				} else {
					result = JSON.parse(stdOut);
				}
				cb(result);
				fs.truncate(self.db+'.c', self.length, function(){
					self.busy = false;
				});
			})
		});
	})
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
	})
}

DB.prototype.stop = function(){
	clearInterval(this.interval);
	this.library.DB_SIZE = this.length;
	fs.writeFileSync(this.db+'.json', JSON.stringify(this.library))
}

var nebuladb = {
	create: function(name, isNew){
		var db = new DB();
		db.init({db: name, isNew: isNew});
		db.start();
		return db;
	}
};

module.exports = nebuladb;
