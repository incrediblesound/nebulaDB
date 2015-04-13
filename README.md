WangDB
======
Wangdb started out as a logic programming language but I decided to make it into a database because it would be my first, and there seemed to be many limitations of a graph based logic programming language.    
Wangdb uses a simple graph based schema that looks like this:
```javascript
[ source, relation, target ]
```
Entering three strings in this way creates three nodes in the database and sets up a special (Node)-[Link]-(Node) relationship between them. You can also use the symbol '->' in the relation position to indicate that the source node has the state indicated by the target node, for example:
```javascript
[ 'john', '->', 'admin']
[ 'john', '->', 'user']
[ 'john', 'first_name', 'John']
```
There are two ways to query the database. The first way is to simply query a pattern. The database will response with a boolean that tell you whether or not the pattern exists in the database.
```javascript
['john','->','admin'] //=> {hasState: true}
['john','->','founder'] //=> {hasState: false}
```
The second way to query is by using an asterisk to indicate which kinds of data you want to see. So far there are two available patterns:
```javascript
['john','->','*'] 
// returns array of simple states: ['admin','user']
['john','*','*']  
// returns hash of all states: {first_name: 'John', hasState: 'admin'}
```
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
