NebulaDB
======
NebulaDB implements a simple and intuitive graph database on top of [RethinkDB](https://www.rethinkdb.com/). It is experimental and is currently not as expressive or robust as it could be, but I encourage folks to try it out and make pull requests or open issues. Because RethinkDB has a solid platform problems related to persistence can be ignored and a clean expressive interface can more easily be attained.

To run the database first install [RethinkDB](https://www.rethinkdb.com/) and get your RethinkDB server up and running. Next clone this repository and run the following commands:

To create a new Nebula database in Rethink:
```shell
node createDB mydatabase
```
You will see a success message if everything goes well.


Next, run the server to listen for reads and writes on your database. This command takes the name of your database as a single option:
```shell
node nebula mydatabase
```
You will see a message telling you that the server is listening for requests. Next, I reccommend using [Postman](https://www.getpostman.com/) to experiment with the API. You simply send Nebula queries in raw text to the API like this:

(POST) /save "['I like toast']"    
(POST) /query "['I like *']"  	=> response: ['toast']        

Documentation
-------------

NebulaDB uses a simple graph based schema that looks like this:
```javascript
[ source, relation, target ]
```
Entering three strings in this way creates three nodes in the database and sets up a special (Node)-[Link]-(Node) relationship between them. You can also use the reserved symbol '->' in the relation position to indicate that the source node has the state indicated by the target node, for example:
```javascript
'john -> admin'
'john -> user'
'john first_name John'
```
This symbol '->' denotes a simple state. It is used for boolean properties, in other words properties that a node either has or does not have.
```javascript
db.save("John -> admin");
db.save("Mary -> user");
db.query("Mary -> admin"); // returns false
```
There are two ways to query the database. The first way is to simply query a pattern. The database will response with a boolean that tell you whether or not the pattern exists in the database.
```javascript
'john -> admin' //=> true
'john -> founder' //=> false
```
The second way to query is by using an asterisk to indicate which kinds of data you want to see. So far there are three available patterns:
```javascript
db.query('john -> *')
// returns array of simple states: { simpleStates: ['admin','user'] }
db.query('john first_name *')
// returns the target pointed to by the node in the relation position: { first_name: ["John"] }
db.query('john * *')
// returns hash of all target states: { first_name: ['John'], hasState: ['admin'] }
db.query('* -> admin')
// returns array of all states that obtain the admin state: { simpleStates: ['john'] }
db.query('* * 30')
// returns hash of all source states: { 'age': ['john'], 'simpleState': ['old'] }
```

Initialization
--------------
```javascript
db.init({name: "dbname"})
```
This method creates a new database with the name "dbname" and returns a nebuladb instance. If this is the first init, a json file will be created in the data directory, otherwise nebula will try to load previously saved data for this database. This method is not used directly, but is accessed via the node_nebula module's open method.

Saving
------
```javascript
db.save('a b c')
db.saveAll(['a b c',
	    	'a b c',
	    	'a b c'
	   		])
```
The save method saves a record to the database. All non-existent nodes will be created. The saveAll method takes an array of records and pushes them all into the queue. Queries in string form will be parsed into arrays for processing, but if any of the terms contains spaces you can use array format to define the divisions between source, relation and target.
```javascript
db.save('Dave -> user');
db.save(['Dave', 'comment', 'This board is too negative!']);
```
Querying
--------
```javascript
db.query('a b c', callback)
``` 
The query method tests the database using the given query and passes the result into the callack. There are currently eight types of queries:
```javascript
[a,  b, c] // does item a have relation b to item c -> boolean
[a, ->, c] // does item a have state c -> boolean
[a, ->, *] // what are the states of item a -> array
[a,  b, *] // what is the item with relation b to item a -> object
[a,  *, *] // what are all the relation/target pairs for item a -> object
[*,  *, c] // what are all the source/relation pairs for item c
[*, ->, c] // what are all the states that obtain state c
[*,  b, c] // what item(s) have relation b to c
```
Editing
-------
```javascript
db.removeLink('a b c');
```
The removeLink method removes a relationship between A and node B. Removing nodes isn't really an option in NebulaDB, but a node with nothing pointing to it is basically inaccessible until another node is updated or created with a connection to that node via its value.
