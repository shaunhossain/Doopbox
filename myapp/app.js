var express = require('express');
var webhdfs = require('webhdfs');
var swig = require('swig');
var bodyParser = require('body-parser')
var mysql      = require('mysql');


var app = express();

var svrHost = '192.168.1.100';
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

/* match example: 
 * /home
 * /home//
 * /home//sljff
 * /home/a/b/c//
 * /home/a/b/c//sfjiew
 */
app.get('/home$|home*//+*', function (request, response) {
	var path = request.originalUrl;
	response.redirect('/home/');
});

app.get('/home*', function (request, response) {

	var path = request.params[0];
	path = '/home/' + 't1' + path;
	
	var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=LISTSTATUS';


	hdfs._sendRequest('GET', reqURL, '', function cb(err, res, body) {

		console.log(body);

		var page = swig.renderFile('templates/main.html', {
			data: body
		}); 
		response.send(page)

	});
});

app.get('/dbox/v1/*', function (request, response) {

	var path = request.params[0];
	var op = request.query.op;
	var redirect_path = ('/home/' + path).slice(0, -1);
	redirect_path = redirect_path.substring(0, redirect_path.lastIndexOf('/') + 1);

	console.log("xxxx======------->  " + redirect_path);

	console.log(path);

	path = '/home/' + 't1/' + path;

	var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=' + op + '&recursive=true';


	console.log(reqURL);


	switch (op) {
		case 'DELETE':
			hdfs._sendRequest('DELETE', reqURL, '', function cb(err, res, body) {
				var page = swig.renderFile('templates/main.html', {
					data: body
				});
				response.redirect(redirect_path);
				//response.send(page)
			});
			break;
	}
});

app.get('/webhdfs/v1/*', function (request, response) {

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
  			response.redirect('/home/');
  		} else {
  			

  		}
	});
	connection.end();
});


app.post('/signup/', function (request, response) {
	var username = request.body.username;
	var password = request.body.password;
	var repassword = request.body.repassword;
	var email = request.body.email;

	var connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		database: 'doopbox',
		password: '123456'
	});

	var sql = 'select * from account where username=' + '\"' + username + '\"';
	connection.query(sql, function(err, results) {
  		if (err) throw err;
  		if (results.length > 0) {
  			// account exists.
  			response.redirect('/signup/');
  		} else {
  			// insert account recoard.
  			sql = 'insert into account(`username`, `password`, `email`) values(' 
	  			+ '\"' + username + '\"' + ', password(' + '\"' 
	  			+ password + '\"' + '),' + '\"' + email + '\")';
			connection.query(sql, function(err, results) {
  				if (err) throw err;
  				var accid = results.insertId;
  				// request HDFS mkdir.
  				var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1/home/' + accid + '?op=MKDIRS';
  				console.log(reqURL);
  				hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
					response.redirect('/signup/');
				});  				
			});
		}
	});

	//connection.end();

});







app.get('/signup/', function (request, response) {

	console.log('lsfjlsdflsfslfjsjfsjfskfslfj')

	var page = swig.renderFile('templates/signup.html', {
		pagename: 'hahahahha'
	});
	response.send(page)
});

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});
