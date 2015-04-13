var nebulaDB = require('./nebula.js');
var db = nebulaDB.create('testdb', true);

db.saveAll([
	['james','->','user'],
	['james','password','th_805!'],
	['james','last_name','Madison']
	]);
db.save(['tony','->','user']);
db.save(['tony','->','boss']);
db.save(['tony','boss','james']);
db.save(['boss','->','powerful'])

db.query(['tony','->','*'], function(response){
	console.log(response);
});
db.query(['james','*','*'], function(response){
	console.log(response);
});
db.query(['james','password','*'], function(response){
	console.log(response);
	db.stop();
});