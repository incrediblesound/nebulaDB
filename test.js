
var nebulaDB = require('./src/nebuladb.js');
nebulaDB.create('nebula', function(db){
	db.start();

	// db.save(['name -> attr']);
	// db.save(['tony -> user']);
	// db.save(['tony -> admin']);
	// db.save(['tony','name', 'Tony Baloney']);
	// db.save(['tony','speciality', 'Security']);
	// db.save(['tony','speciality', 'Software']);
	// db.save(['tony','speciality', 'HR']);
	// db.save(['tony','phone','111-222-3333']);
	// db.save(['tony','phone', '111 222 3333']);

	// db.save(['person1','name','james'])
	// db.save(['person2','name','james'])
	// db.save(['person3','last_name','james'])
	// db.save(['first_name','->','james'])
	// db.save(['good_name','->','james'])

	db.query(['*','name','james'], function(result){
		console.log(result);
	});

	db.stop();
});