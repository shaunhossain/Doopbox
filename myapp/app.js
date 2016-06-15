var express = require('express');
var webhdfs = require('webhdfs');
var swig = require('swig');

var app = express();


app.get('/', function (request, response) {
	// response.render('index', { title: 'Doopbox', message: 'Hello there!'});
	var page = swig.renderFile('templates/index.html', {
		pagename: 'hahahahha'
	});
	response.send(page)
});

app.get('/webhdfs/v1/home/', function (reqest, response) {
	var hdfs = webhdfs.createClient({
		user: '',
		host: '192.168.1.131',
		port: 50070
	});

	hdfs._sendRequest('GET', 'http://192.168.1.131:50070/webhdfs/v1//?op=LISTSTATUS', '', function cb(err, res, body) {
		response.jsonp(body);
		// console.log(body.FileStatuses.FileStatus[0].owner);
	});



	


	//var dir = hdfs.readdir("/home");
	//dir.on('data', function onChunk(chunk) {
	//	console.log(chunk)
	//	res.jsonp({user: 'hello world!'});
	//});

});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
