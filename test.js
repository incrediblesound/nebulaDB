
var nebulaDB = require('./src/nebuladb.js');
nebulaDB.create('nebula', function(db){
	db.start();

	// db.save(['tony -> user']);
	// db.save(['name -> attr']);
	db.save(['Tony Baloney','->','name']);
	db.save(['tony','name', 'Tony Baloney']);

	db.query(['tony','name','*'], function(result){
		console.log(result);
	});

	db.stop();
});