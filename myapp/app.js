var express = require('express');
var session = require('client-sessions');
var webhdfs = require('webhdfs');
var breadcrumbs = require('express-breadcrumbs');
var swig = require('swig');
var bodyParser = require('body-parser')
var mysql      = require('mysql');


var app = express();

var svrHost = '10.138.50.78';
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

app.use(breadcrumbs.init());
//app.use(breadcrumbs.setHome());
app.use('/admin', breadcrumbs.setHome({
  name: 'Dashboard',
  url: '/admin'
}));



app.use(session({
  cookieName: 'session',
  secret: '123456789abc',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000,
}));



app.get('/', function (request, response) {
	var username = request.session.username;
	var password = '';


	// response.render('index', { title: 'Doopbox', message: 'Hello there!'});
	var page = swig.renderFile('templates/index.html', {
		username: username,
		password: password
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



	var username = request.session.username;
	if (username == null) {
		response.redirect('/');
	} else {
		var path = request.params[0];



		var values = path.split('/');
		console.log('====-------------------');
		var url = '/home/';
		var name = '';
		for (i in values) {
			if (values[i] != '') {
				url = url + values[i] + '/';
				name = values[i];
				console.log('name ====>   ' + name);
				console.log('url ====>   ' + url);

				request.breadcrumbs(name, url);
			}


		}
		console.log('====-------------------');

			





		path = '/home/' + username + path;


		var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=LISTSTATUS';



		

		hdfs._sendRequest('GET', reqURL, '', function cb(err, res, body) {
			var page = swig.renderFile('templates/main.html', {
				data: body,
				breadcrumbs: request.breadcrumbs()
			}); 
			response.send(page)
		});
	}
});

app.put('/dbox/v1/*', function (request, response) {

	var username = request.session.username;
	if (username == null) {
		response.redirect('/');
	} else {

		var path = request.params[0];
		var op = request.query.op;

		console.log('operator -----> ' + op);

		var redirect_path = ('/home/' + path).slice(0, -1);
		redirect_path = redirect_path.substring(0, redirect_path.lastIndexOf('/') + 1);

		console.log("xxxx======------->  " + redirect_path);

		console.log(path);

		path = '/home/' + username + '/' + path;

		var reqURL = '';

		switch (op) {
			case 'UPLOAD':
				reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=CREATE&overwrite=true';

				console.log('---++++++++====--> ' + reqURL);

				console.log(reqURL);
				hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
					var location = '';
					if (res.statusCode == 307) {
						location = res.headers.location;
						console.log('===================>>>> ' + location);
						response.send(location);
					}
				});
				break;
		}
	}
});

app.get('/dbox/v1/*', function (request, response) {
	var username = request.session.username;
	if (username == null) {
		response.redirect('/');
	} else {

		var path = request.params[0];
		var op = request.query.op;

		console.log('operator -----> ' + op);

		var redirect_path = ('/home/' + path).slice(0, -1);
		redirect_path = redirect_path.substring(0, redirect_path.lastIndexOf('/') + 1);

		console.log("xxxx======------->  " + redirect_path);

		console.log(path);

		path = '/home/' + username + '/' + path;

		var reqURL = '';


		switch (op) {
			case 'DELETE':
				reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=' + op + '&recursive=true';
				console.log(reqURL);
				hdfs._sendRequest('DELETE', reqURL, '', function cb(err, res, body) {
					var page = swig.renderFile('templates/main.html', {
						data: body
					});
					response.redirect(redirect_path);
					//response.send(page)
				});
				break;
			case 'DOWNLOAD':
				reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=OPEN';
				hdfs._sendRequest('GET', reqURL, '', function cb(err, res, body) {

					if (err) {
						console.log(err);
					} else {

						var href = '';
						if (res.statusCode == 200) {
							href = res.request.uri.href;
							console.log('-----> ' + href);
							response.redirect(href);
						}
					}
				});
				break;
			case 'UPLOAD':
				reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=CREATE&overwrite=true';
				console.log(reqURL);
				hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
					var href = '';

					console.log(err);
					//console.log(res);
					//console.log(body);


					if (res.statusCode == 200) {
						href = res.request.uri.href;
						console.log('-----> ' + href);
						response.send(err);
					}
				});
				break;
		}



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




	console.log('sessionsssss =======>  ' + request.session.passwd)




	var username = request.body.username;
	var password = request.body.password;

	var connection = mysql.createConnection({
		host: 'localhost',
		user: 'root',
		database: 'doopbox',
		password: '123456'
	});
	connection.connect();

	var sql = 'select * from account where username=' + '\"' + username + '\"' + ' and password=password(\"' + password + '\")';


	connection.query(sql, function(err, results) {
  		if (err) throw err;
  		console.log('The solution is: ', results);

  		if (results.length > 0) {
  			// verify ok.
  			// response.send(username + '  ' + password);

  			request.session.username = username;
  	
  			response.redirect('/home/');


  		} else {
  			console.log('-------> ', results);



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
					// response.redirect('/signin?username=' + username + '&' + 'password=' + password);
					request.session.username = username;
					response.redirect('/')
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
