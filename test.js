var wangDB = require('./wang.js');
var wangdb = wangDB.create('testdb', true);

wangdb.save(['james','->','user']);
wangdb.save(['james','password','th_805!'])
wangdb.save(['tony','->','user']);
wangdb.save(['tony','->','boss']);
wangdb.save(['tony','boss','james']);
wangdb.save(['boss','->','powerful'])

wangdb.query(['james','->','*'], function(response){
	console.log(response);
})
wangdb.query(['james','password','*'], function(response){
	console.log(response);
	wangdb.stop();
})