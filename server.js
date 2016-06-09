//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');
var express = require("express");
var http = require("https");
var app = express();

//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;

// Connection URL. This is where your mongodb server is running.

//(Focus on This Variable)

app.get("/", function(request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write("Use /new/url to get the tinyurl of a site\n");
    response.end("Or enter  the tinyurl of a site");
});
app.get("/api/imagesearch/:string", function(request, response,next) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    console.log("F");
    var q=request.params.string;
    var num=request.query.offset||10;
    getM("https://www.googleapis.com/customsearch/v1?q="+q+"&num="+num+"&searchtype=image&cx=015740443609325608978%3Achvejfx7lbq&key=AIzaSyD0jyiko1BDpDYWqtGGNw-rwiNYMN6T9Yw",function(out){
        response.end(output);
    });
    function getM(options,callback) {
        http.get(options, function(response) {
            // Continuously update stream with data
            var body = '';
            response.on('data', function(d) {
                body += d;
            });
            response.on('end', function() {
                callback(body);
            });
        });
    }

});
app.get("/:number", function(request, response,next) {
    
    console.log("G");
    var mongo_url = process.env.MONGOLAB_URI;      
    //(Focus on This Variable)
    // Use connect method to connect to the Server
    MongoClient.connect(mongo_url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        }
        else {
            console.log('Connection established to', mongo_url);
            var collection = db.collection('urls')
            collection.find({"id":parseInt(request.params.number)}).limit(1).toArray(function(err,doc){
                if(doc.length===0){
                    json_res={"result":"no url to redirect"};
                    response.end(JSON.stringify(json_res));
                }
                else {
                    response.setHeader("Location", doc[0].url);
                    response.writeHead(302);
                    response.end();
                }
                db.close();
            });
        }
    });    
    
});
app.get("*", function(request, response) {
    response.end("404!");
});
http.createServer(app);
var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});