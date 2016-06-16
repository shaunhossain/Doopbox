var express = require('express');
var webhdfs = require('webhdfs');
var swig = require('swig');
var bodyParser = require('body-parser')
var mysql      = require('mysql');


var app = express();

var svrHost = '192.168.199.70';
var svrPort = 50070;

var hdfs = webhdfs.createClient({
	user: '',
	host: svrHost,
	port: svrPort
});



// config 
app.use(bodyParser.urlencoded());
app.use(bodyParser.json());
app.use('/assets', express.static(__dirname + '/assets'));


app.get('/', function (request, response) {
	// response.render('index', { title: 'Doopbox', message: 'Hello there!'});
	var page = swig.renderFile('templates/index.html', {
		pagename: 'hahahahha'
	});
	response.send(page)
});

app.get('/main/', function (request, response) {

	/*var page = swig.renderFile('templates/main.html', {
		pagename: 'hahahahha'
	});
	response.send(page)*/

	var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1/home/xushuai/?op=LISTSTATUS';
	hdfs._sendRequest('GET', reqURL, '', function cb(err, res, body) {

		console.log(body);

		var page = swig.renderFile('templates/main.html', {
			data: body
		}); 
		response.send(page)

	});
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

app.post('/signin/', function (request, response) {
	var username = request.body.username;
	var password = request.body.password;

	var connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		database: 'doopbox',
		password: '123456'
	});
	connection.connect();

	var sql = 'select * from account where username=' + '\"' + username + '\"' + 'and password=password(' + password + ')';
	connection.query(sql, function(err, results) {
  		if (err) throw err;
  		console.log('The solution is: ', results);

  		if (results.length > 0) {
  			// verify ok.
  			// response.send(username + '  ' + password);
  			response.redirect('/main/');

  		} else {
  			

  		}
	});

	connection.end();

	
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});
