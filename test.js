var wangDB = require('./src/wangdb.js');
var wangdb = wangDB.create('testdb', false);

wangdb.query(['james','->','user'], function(response){
	console.log(response);
})
wangdb.query(['tony','->','boss'], function(response){
	console.log(response);
})
wangdb.query(['tony','boss','james'], function(response){
	console.log(response);
	wangdb.stop();
})