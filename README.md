NebulaDB
======
NebulaDB started out as a logic programming language but I decided to make it into a database because it would be my first, and there seemed to be many limitations of a graph based logic programming language. It is currently in the early stages of development and I welcome contributors.    

NebulaDB runs on a Node server. There is a Node.js module for interfacing with the NebulaDB server that can be found [here](https://github.com/incrediblesound/node-nebula). To run this database, clone the repository or download from npm:
```shell
npm install nebuladb
```
Then run the server:
```shell
node nebula.js
>NebulaDB listening on port 1984
```
You will see a little message telling you that the server is listening for requests, and then you can use the node_nebula module to save and query data.    

Documentation
-------------

NebulaDB uses a simple graph based schema that looks like this:
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
['john','->','admin'] //=> { hasState: true }
['john','->','founder'] //=> { hasState: false }
```
The second way to query is by using an asterisk to indicate which kinds of data you want to see. So far there are three available patterns:
```javascript
['john','->','*'] 
// returns array of simple states: ['admin','user']
['john','first_name','*']
// returns the target pointed to by the node in the relation position: { first_name: "John" }
['john','*','*']  
// returns hash of all states: { first_name: 'John', hasState: 'admin' }
```
Use
---
```javascript
//require the main file
var nebuladb = require('./nebula.js');

//create a new database
var db = nebuladb.create('testdb', true);

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
Methods
-------
```javascript
var db = nebuladb.create(test_name, is_new)
```
This method creates a new database with the name test_name and returns a nebuladb instance. If is_new is true, nebuladb will create a new database from scratch, otherwise it will try to load previously saved data for this database.
```javascript
db.save([a, b, c])
db.saveAll([[a,b,c],
			[a,b,c],
			[a,b,c]
			])
```
The save method saves a record to the database. It will probably take a callback in the future when I implement error messaging. The saveAll method is basically the same, but it takes an array or records and pushes them all into the queue.
```javascript
db.query([a,b,c], callback)
``` 
The query method tests the database using the given query and passes the result into the callack. There are currently five types of queries:
```javascript
[a,  b, c] // does item a have relation b to item c -> boolean
[a, ->, c] // does item a have state c -> boolean
[a, ->, *] // what are the states of item a -> array
[a,  b, *] // what is the item with relation b to item a -> object
[a,  *, *] // what are all the relation/target pairs for item a -> object
```
The close method stops the database instance from listening for queries and saves the current node tree to disk. NebulaDB uses an in-memory data structure for quick look-up, so it is important to close the db instance before ending the node process so that this tree can be written to disk.
```javascript
db.close() // and thats it!
```
