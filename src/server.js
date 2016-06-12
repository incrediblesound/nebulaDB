var http = require('http');
var nebulaDB = require('./nebuladb.js');

module.exports = function(dbName){
  nebulaDB.create(dbName, function(DB){
    var port = 1984;
    var ip = '127.0.0.1';

    var server = http.createServer(requestHandler);
    var headers = {
      "access-control-allow-origin": "*",
      "access-control-allow-methods": "POST",
      "access-control-allow-headers": "content-type, accept",
      "access-control-max-age": 60 // Seconds.
    };

    server.listen(port, ip);
    console.log('NebulaDB listening on port '+port);

    function requestHandler(req, res){
      res.writeHead(200, headers);
      retrieveData(req, function(data){
        if(req.url === '/save'){
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
      })
    }
  })

}

function retrieveData(request, cb){
  request.on('data', function(chunk) {
        chunk = chunk.toString();
        chunk = JSON.parse(chunk);
        cb(chunk);
    });
}
