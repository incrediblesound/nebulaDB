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
	this.library = {};
};

DB.prototype.init = function(options, cb){
	this.db = options.db;
	this.tail = '\n};\n';
	var isFile = fs.existsSync('../'+this.db+'.c');
	if(!isFile){
		fs.writeFileSync(this.db+'.c', '#include \"src/core.h\"\n\nint main(){\n')
	} else {
		var lib = fs.readFileSync(this.db+'.json');
		lib = JSON.parse(lib);
		this.length = lib.DB_SIZE;
		compiler.loadLibrary(lib);
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
	this.busy = true;
	var self = this;
	this.parse(query, function(code){
		fs.appendFile(self.db+'.c', code, function(){
			stats = fs.statSync(self.db+'.c')
			self.length = stats.size;
			self.library.DB_SIZE = self.length || 0;
			fs.writeFile(self.db+'.json', JSON.stringify(self.library), function(err){
				self.busy = false;
			})
		});
	})
}

DB.prototype.save = function(query, cb){
	this.stack.push([query, null, false])
	cb();
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
		exec('gcc '+self.db+'.c -o out',{maxBuffer: 1024 * 10000}, function(err){
			if(err) console.log('COMPILE ERROR: ', err);

			exec('./out',{maxBuffer: 1024 * 10000}, function(err, stdOut){
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
	}, 10)
}

var nebuladb = {
	create: function(data, cb){
		var db = new DB();
		db.init({db: data.name, isNew: data.isNew}, function(){
			db.start();
			cb(db);
		});
	}
};

module.exports = nebuladb;
