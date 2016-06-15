var express = require('express');
var webhdfs = require('webhdfs');
var swig = require('swig');

var app = express();

var svrHost = '192.168.1.131';
var svrPort = 50070;

var hdfs = webhdfs.createClient({
	user: '',
	host: svrHost,
	port: svrPort
});


app.get('/', function (request, response) {
	// response.render('index', { title: 'Doopbox', message: 'Hello there!'});
	var page = swig.renderFile('templates/index.html', {
		pagename: 'hahahahha'
	});
	response.send(page)
});

app.get('/webhdfs/v1/*', function (request, response) {

	var oriUrl = request.originalUrl;
	var path = request.params[0];
	var op = request.query.op;
	var reqURL = 'http://' + svrHost + ':' + svrPort + request.path + '?op=' + op;

	console.log(reqURL);

	switch (op) {
		case 'LISTSTATUS':
			hdfs._sendRequest('GET', reqURL, '', function cb(err, res, body) {
				response.jsonp(body);
				// console.log(body.FileStatuses.FileStatus[0].owner);
			});
			break;
	}

});

app.put('/webhdfs/v1/*', function (request, response) {

	var oriUrl = request.originalUrl;
	var path = request.params[0];
	var op = request.query.op;
	var reqURL = 'http://' + svrHost + ':' + svrPort + oriUrl;

	console.log(reqURL);

	switch (op) {
		case 'MKDIRS':
			hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
				response.jsonp(body);
			});
			break;
	}

});










app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
