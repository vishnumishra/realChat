/*requiring node modules starts */

var app = require("express")();
var http = require('http').Server(app);
var io = require("socket.io")(http);
var Session = require('express-session');
var cookieParser = require('cookie-parser'); 
/*requiring node modules ends */


// the session is stored in a cookie, so we use this to parse it
app.use(cookieParser());

var Session= Session({
	secret:'secrettokenhere',
	saveUninitialized: true,
	resave: true
});


io.use(function(socket, next) {
	    Session(socket.request, socket.request.res, next);
});


app.use(Session);

var sessionInfo;

/* requiring config file starts*/
var config =require('./middleware/config.js')(app);
/* requiring config file ends*/

/* requiring config db.js file starts*/
var db = require("./middleware/db.js");
var connection_object= new db();
var connection=connection_object.connection; // getting conncetion object here 
/* requiring config db.js file ends*/


/* 
	1. Requiring auth-routes.js file, which takes care of all Login & Registration page operation.
	2. Passing object of express, Database connection, expressSession and cookieParser.
	3. auth-routes.js contains the methods and routes for Login and registration page. 
*/
require('./middleware/auth-routes.js')(app,connection,Session,cookieParser,sessionInfo);
/* 
	1. Requiring routes.js file, which takes handles the Home page operation.
	2. Passing object of express, Database connection and object of socket.io as 'io'.
	3. routes.js contains the methods and routes for Home page  
*/
require('./middleware/routes.js')(app,connection,io,Session,cookieParser,sessionInfo);

/*
	Running our application  
*/
http.listen(81,function(){
    console.log("Listening on http://127.0.0.1:81");
});