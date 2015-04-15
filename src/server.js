var http = require('http');
var nebuladb = require('./nebuladb.js');

var port = 1984;
var ip = '127.0.0.1';
var DB;

var server = http.createServer(requestHandler);
var headers = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "POST",
  "access-control-allow-headers": "content-type, accept",
  "access-control-max-age": 10 // Seconds.
};

server.listen(port, ip);
console.log('NebulaDB listening on port '+port);

function requestHandler(req, res){
	res.writeHead(200, headers);
	retrieveData(req, function(data){
		if(req.url === '/init'){
			nebuladb.create(data, function(database){
				DB = database;
				res.end();
			});
		}
		else if(req.url === '/save'){
			DB.save(data);
			res.end();
		}
		else if(req.url === '/saveall'){
			DB.saveAll(data);
			res.end();
		}
		else if(req.url === '/query'){
			DB.query(data, function(result){
				res.end(JSON.stringify(result));
			})
		}
		else if(req.url === '/close'){
			DB.stop();
		}

	});
}

module.exports = server;

function retrieveData(request, cb){
	request.on('data', function(chunk) {
        chunk = chunk.toString();
        chunk = JSON.parse(chunk);
        cb(chunk);
    });
}
