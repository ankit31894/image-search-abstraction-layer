//lets require/import the mongodb native drivers.
var mongodb = require('mongodb');
var express = require("express");
var https = require("https");
var fs = require('fs');
var app = express();
var options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
//We need to work with "MongoClient" interface in order to connect to a mongodb server.
var MongoClient = mongodb.MongoClient;
var mongo_url = process.env.MONGOLAB_URI||'mongodb://localhost:27017/my_database_name';

// Connection URL. This is where your mongodb server is running.

//(Focus on This Variable)

app.get("/", function(request, response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.write("Use /api/imagesearch/any_value to search the image\n");
    response.end("Or /api/latest/imagesearch/ to get latest searches");
});
app.get("/api/imagesearch/:string", function(request, response,next) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    var q=request.params.string;
    var num=Math.min(request.query.offset||0,90);
    var ar=[];
    getM("https://www.googleapis.com/customsearch/v1?q="+q+"&start="+num+"&searchtype=image&cx=015740443609325608978%3Achvejfx7lbq&key=AIzaSyD0jyiko1BDpDYWqtGGNw-rwiNYMN6T9Yw",function(out){
        var json_res=JSON.parse(out);
        for(var i=0;i<json_res.items.length;i++){
            if(json_res.items[i].pagemap.cse_image!=undefined)
            ar.push({
                alt:json_res.items[i].snippet,
                url:json_res.items[i].pagemap.cse_image[0].src,
                page_url:json_res.items[i].link
            });
        }

        // Use connect method to connect to the Server
        MongoClient.connect(mongo_url, function (err, db) {
            if (err) {
                console.log('Unable to connect to the mongoDB server. Error:', err);
            }
            else {
                console.log('Connection established to', mongo_url);
                var collection = db.collection('ial')
                 collection.insert({string:q}, function(err,s) {
                     console.log(s);
                    db.close();
                 });
            }
        });

        response.end(JSON.stringify(ar));
    });
    function getM(options,callback) {
        https.get(options, function(response) {
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
app.get("/api/latest/imagesearch", function(request, response,next) {

    // Use connect method to connect to the Server
    MongoClient.connect(mongo_url, function (err, db) {
        if (err) {
            console.log('Unable to connect to the mongoDB server. Error:', err);
        }
        else {
            console.log('Connection established to', mongo_url);
            var collection = db.collection('ial')
            collection.find().limit(10).sort({_id: -1}).toArray(function(err,doc){
                var temp=[];
                for(var i=0;i<doc.length;i++){
                    temp.push({string:doc[i].string,time:doc[i]._id.getTimestamp()});
                }
                response.end(JSON.stringify(temp));
                db.close();
            });
        }
    });

});
app.get("*", function(request, response) {
    response.end("404!");
});
https.createServer(options, app);
//http.createServer(app);
var port = process.env.PORT || 8080;
app.listen(port,  function () {
	console.log('Node.js listening on port ' + port + '...');
});
