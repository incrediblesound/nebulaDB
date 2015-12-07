var nebulaDB = require('./src/nebuladb.js');
var db = nebulaDB.create('testdb', function(db){

	db.saveAll([
		['james','->','user'],
		['james','password','th_805!'],
		['james','last_name','Madison']
		]);
	db.save(['tony','->','user']);
	db.save(['tony','->','boss']);
	db.save(['tony','boss','james']);
	db.save(['boss','->','powerful'])

	db.query(['tony','->','*'], function(error, response){
		console.log(response);
	});
	db.query(['james','*','*'], function(error, response){
		console.log(response);
	});
	db.query(['james','password','*'], function(error, response){
		console.log(response);
		db.stop();
	});

});