var express = require('express');
var session = require('client-sessions');
var webhdfs = require('webhdfs');
var breadcrumbs = require('express-breadcrumbs');
var swig = require('swig');
var bodyParser = require('body-parser')
var mysql      = require('mysql');
var fileUpload = require('express-fileupload');
var mkdirp = require('mkdirp');
var fs = require('fs');

var app = express();

var svrHost = 'master.hadoop';
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
app.use(fileUpload());

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
    console.log("+++++++++++++++++++++");
	var username = request.session.username;
	if (username == null) {
		response.redirect('/');
	} else {
		var path = request.params[0];
		var op = request.query.op;
		var redirect_path = ('/home/' + path).slice(0, -1);
		redirect_path = redirect_path.substring(0, redirect_path.lastIndexOf('/') + 1);
		console.log(path);
		path = '/home/' + username + '/' + path;
		var reqURL = '';
		switch (op) {
			case 'UPLOAD':
				reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=CREATE&overwrite=true';

				console.log('putputputputpu>>>> ', reqURL);
				console.log('putputputputpu>>>> ', request.body.name);

				hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
					var location = '';
					if (res.statusCode == 307) {
						location = res.headers.location;
						//console.log('===================>>>> ' + location);
						//response.send(location);
                        //
                        var href = '';
                        //href = res.request.uri.href;
                        href = location;
                        console.log('xxxxxxyy-----> ' + href);
                        //response.redirect(href);
                        response.send("xxxxxx");
                        
					}
                    /*if (err) {
						console.log(err);
					} else {
						var href = '';
						if (res.statusCode == 200) {
							href = res.request.uri.href;
							console.log('xxxxxxyy-----> ' + href);
							response.redirect(href);
						}
					}*/

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
							response.redirect(href);
						}
					}
				});
				break;
			case 'UPLOAD':
				console.log('lalalalallaallalla.....');
                reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=CREATE&overwrite=true';
                console.log('yyyyyyyyyyy>>>> ', reqURL);
                hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
                if (res.statusCode == 307) {
                    var location = res.headers.location;
                    console.log(location);
                    var dstpath = location.split('?')[0];
                    response.jsonp({DstPath:dstpath});
                }
                /*if (err) {
                    console.log(err);
                } else {
                    var href = '';
                    if (res.statusCode == 200) {
                        href = res.request.uri.href;
                        console.log('xxxxxxyy-----> ' + href);
                        response.redirect(href);
                    }
                }*/
                });
				break;
		}
	}
});

app.get('/webhdfs/v1/*', function (request, response) {
	var path = request.params[0];
	var op = request.query.op;
	var reqURL = 'http://' + svrHost + ':' + svrPort + request.path + '?op=' + op;
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
  		}
	});
	connection.end();
});

app.post('/dbox/v1/*', function (request, response) {
	var username = request.session.username;
    var path = request.params[0];
	var redirect_path = ('/home/' + path).slice(0, -1);
	var op = request.query.op;
    path = '/home/' + username + '/' + path;
    var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=LISTSTATUS';
	switch (op) {
        case 'MKDIR':
            reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=MKDIRS';
  		    console.log(reqURL);
  			hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
                response.redirect(redirect_path);
  		        console.log("redirect == >> "  + redirect_path);
            });
            break;
        case 'RENAME':
            var newname = request.query.nn;
            var oldname = request.query.on;
            var curpath = path; 
            var oldpath = curpath + oldname;
            var newpath = curpath + newname;
            console.log('oldpath --------> ' + oldpath);
            console.log('newpath --------> ' + newpath);

            reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + oldpath + '?op=RENAME&destination=' + newpath;
            console.log(reqURL);
            hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
                response.redirect(redirect_path);
            });
            break;
      
        case 'UPLOAD':
            reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1' + path + '?op=CREATE&overwrite=true';

            console.log('yyyyyyyyyyy>>>> ', reqURL);

            hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
                var location = '';
                if (res.statusCode == 307) {
                    location = res.headers.location;
                    //console.log('===================>>>> ' + location);
                    //response.send(location);
                    //
                    var href = '';
                    //href = res.request.uri.href;
                    href = location;
                    console.log('xxxxxxyy-----> ' + href);
                    // response.redirect(href);
                }
                /*if (err) {
                    console.log(err);
                } else {
                    var href = '';
                    if (res.statusCode == 200) {
                        href = res.request.uri.href;
                        console.log('xxxxxxyy-----> ' + href);
                        response.redirect(href);
                    }
                }*/
            });
            break;
	}
});

app.post('/upload/*', function(req, res) {
    console.log(req);

	var username = req.session.username;
    var path = req.params[0];

	var redirect_path = ('/home/' + path).slice(0, -1);

	if (username == null) {
		response.redirect('/');
	} else {

        mkdirp('/tmp/doopbox/home/' + username + '/' + path, function (err) {
                if (err) console.error(err)
                else console.log('create dir: ' + '/tmp/doopbox/home/' + username + '/' + path);
        });

        var sampleFile;
        if (!req.files) {
            res.send('No files were uploaded.');
            return;
        }
        sampleFile = req.files.sampleFile;
        var filepath = '/tmp/doopbox/home/' + username + '/' + path + sampleFile.name;
        sampleFile.mv(filepath, function(err) {
            if (err) {
                res.status(500).send(err);
            } else {
                // res.send('File uploaded!');
            }
        });
        console.log('kkkkkk->' + filepath);
        // write to HDFS
        /*var localFileStream = fs.createReadStream(filepath);
        var remoteFileStream = hdfs.createWriteStream('/home/' + username + '/' + path + sampleFile.name);
        localFileStream.pipe(remoteFileStream);
        remoteFileStream.on('error', function onError (err) {
              // Do something with the error 
            console.log("error!");
        });
        remoteFileStream.on('finish', function onFinish () {
            console.log("ok!");
            // Upload is done 
            res.send('File uploaded!');
        });*/
        reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1/home/' + username + '/' + path + sampleFile.name + '?op=CREATE&overwrite=true';

        console.log('yyyyyyyyyyy>>>> ', reqURL);

        hdfs._sendRequest('PUT', reqURL, '', function cb(err, res2, body) {
            var location = '';
            if (res2.statusCode == 307) {
                location = res2.headers.location;
                //console.log('===================>>>> ' + location);
                //response.send(location);
                //
                var href = '';
                //href = res.request.uri.href;
                href = location;
                console.log('xxxxxxyy-----> ' + href);
                // response.redirect(href);
                // write file to HDFS.
                //fs.createReadStream('somefile.zip').pipe(req);
                var request = require("request");

                /*request({
                      uri: href,
                      method: "PUT",
                      //timeout: 10000,
                      //followRedirect: true,
                      //maxRedirects: 10
                }, function(error, response, body) {
                      console.log(body);
                });*/
                /*console.log('xxxx---> ' + href);
                console.log('xxxx---> ' + filepath);
                request(href).pipe(fs.createWriteStream(filepath));*/
                fs.createReadStream(filepath).pipe(request.put(href));
                //res.redirect(redirect_path);
              console.log(" -------- xxxx --- > " + redirect_path);
               res.send('File uploaded!');
               //res.redirect(redirect_path);
            }
            /*if (err) {
                console.log(err);
            } else {
                var href = '';
                if (res.statusCode == 200) {
                    href = res.request.uri.href;
                    console.log('xxxxxxyy-----> ' + href);
                    response.redirect(href);
                }
            }*/
        });

    }
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
  				//var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1/home/' + accid + '?op=MKDIRS';
  				var reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1/home/' + username + '?op=MKDIRS';
  				console.log(reqURL);
  				hdfs._sendRequest('PUT', reqURL, '', function cb(err, res, body) {
					// response.redirect('/signin?username=' + username + '&' + 'password=' + password);
					request.session.username = username;
					response.redirect('/')

                    var welcomefile = "Welcome.txt"; 
                    var welcomefilepath = "/tmp/" + welcomefile;

                    fs.open(welcomefilepath, "w", function(err,fd) {
                        var buf = new Buffer("git clone https://github.com/xushvai/Doopbox.git");
                        fs.write(fd,buf,0,buf.length,0,function(err,written,buffer) {

                            reqURL = 'http://' + svrHost + ':' + svrPort + '/webhdfs/v1/home/' + username + '/'  + welcomefile + '?op=CREATE&overwrite=true';
                            hdfs._sendRequest('PUT', reqURL, '', function cb(err, res2, body) {
                                var location = '';
                                if (res2.statusCode == 307) {
                                    location = res2.headers.location;
                                    var href = location;
                                    var request = require("request");
                                    fs.createReadStream(welcomefilepath).pipe(request.put(href));
                                }
                            }); 
                        });
                    });
				});  				
			});
		}
	});
	//connection.end();
});

app.get('/signup/', function (request, response) {
	var page = swig.renderFile('templates/signup.html', {
		pagename: 'signup'
	});
	response.send(page)
});

app.listen(8080, function () {
  console.log('Example app listening on port 8080!');
});
