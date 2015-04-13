WangDB
======
Wangdb started out as a logic programming language but I decided to make it into a database because it would be my first, and there seemed to be many limitations of a graph based logic programming language.

Use
---
```javascript
//require the main file
var wangdb = require('./wang.js');

//create a new database
var db = wangdb.create('testdb', true);

//save some records
db.save(['james','job','programmer'])
db.save(['james','age','30'])

//query the database
db.query(['james','job','artist'], function(response){
	console.log(response) //=> { hasState: false }
})

db.query(['james','*','*'], function(response){
	console.log(response) //=> {job: 'programmer', age: '30'}
	//stop the database
	db.stop();
})
```
Documentation
-------------
```javascript
wangdb.create(test_name, is_new)
```
This method creates a new database with the name test_name. If is_new is true, wangdb will create a new database from scratch, otherwise it will try to load previously saved data for this database.    

More to come... must sleep.