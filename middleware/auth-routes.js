/*requiring node modules starts */

var bodyParser = require('body-parser');
var multer  = require('multer');
var fs = require('fs');
/*requiring node modules starts */

/*Telling Multer where to upload files*/
var upload = multer({ dest: './views/uploads' });


var method=routes.prototype;

function routes(app,connection,sessionInfo){
	
	var file_path="";
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());

	
	app.get('/', function(req, res){

		sessionInfo=req.session;
		/*Render Login page If session is not set*/
		if(sessionInfo.uid){
			res.redirect('/home#?id='+sessionInfo.uid);
		}else{
			res.render("login");		
		}
	});

	/*
		post to handle Login request
	*/
	app.post('/login', function(req, res){


		sessionInfo=req.session;

		username=req.body.username;
		password=req.body.password;

		var data={
			query:"select * from user where password='"+password+"' and name='"+username+"' ",
			connection:connection
		}
		/*
			Calling query_runner to run  SQL Query
		*/
		query_runner(data,function(result){
			var uid="";			
			result.forEach(function(element, index, array){
				uid=element.id;
			});

			if(result.length>0) {

				//setting session
				sessionInfo.uid = uid;

				var set_online={
					query:"update user set online='Y' where id='"+uid+"'",
					connection:connection
				}
				query_runner(set_online,function(result_online){});	
				result_send={
			    		is_logged:true,
			    		id:uid,
			    		msg:"OK"
			    };	    	
		    } else {
		    	result_send={
		    		is_logged:false,
		    		id:null,
		    		msg:"BAD"
		    	};
		    }
		    /*
				Sending response to client
			*/
		    res.write(JSON.stringify(result_send));
			res.end();
		});
	});

	/*
		post to handle username availability request
	*/
	app.post('/check_name', function(req, res){
		username=req.body.username;		
		var data={
			query:"select * from user where name='"+username+"'",
			connection:connection
		}
		query_runner(data,function(result){
			
			if(result.length>0) {
		    	result_send={
		    		msg:true
		    	};
		    } else {
		    	result_send={
		    		msg:false
		    	};
		    } 
		    res.write(JSON.stringify(result_send));
			res.end();
		});
	});

	/*
		post to Register username request
	*/
	app.post('/register', upload.single('file'), function(req, res, next){

		sessionInfo=req.session;
		if(req.file){
			/*
				Multer file upload starts
			*/
			var file_path = './views/uploads/' + Date.now()+req.file.originalname;
			var file_name = '/uploads/' + Date.now()+req.file.originalname;
			var temp_path = req.file.path;

			var src = fs.createReadStream(temp_path);
			var dest = fs.createWriteStream(file_path);		
			src.pipe(dest);
			/*
				Multer file upload ends
			*/
			src.on('end', function() {
				registerUser(req,res,connection,sessionInfo,file_name)
			});
			src.on('error', function(err) { 
				/*
					Sending Error 
				*/
				res.write(JSON.stringify("Error"));
				res.end(); 
			});
		}else{
			registerUser(req,res,connection,sessionInfo)
		}
	});

	/*
		post to handle Logout request
	*/
	

}

method.getroutes=function(){
	return this;
}

module.exports = routes;

function registerUser(req,res,connection,sessionInfo,file_name){
			/*
				When uploading of file completes, Insert the user.
			*/
			var insert_data = {
			    id: '',
			    name: req.body.username,
			    password: req.body.password,
			    p_photo: file_name,
			    timestamp: Math.floor(new Date() / 1000),
			    online: 'Y'
			};
			var data = {
			    query: "INSERT INTO user SET ?",
			    connection: connection,
			    insert_data: insert_data
			};
			query_runner(data, function(result) {

			    //storing session ID
			    sessionInfo.uid = result.insertId;

			    if (result) {
			        result_send = {
			            is_logged: true,
			            id: result.insertId,
			            msg: "OK"
			        };
			    } else {
			        result_send = {
			            is_logged: false,
			            id: null,
			            msg: "BAD"
			        };
			    }
			    res.write(JSON.stringify(result_send));
			    res.end();
			});
}

/*
	Making query_runner function to Run mysl queries
*/
var query_runner=function(data,callback){
	var db_conncetion=data.connection;
	var query=data.query;
	var insert_data=data.insert_data;
	db_conncetion.getConnection(function(err,con){
		if(err){
		  con.release();
		}else{
			db_conncetion.query(String(query),insert_data,function(err,rows){
		    con.release();
		    if(!err) {
		    	callback(rows);
		    } else {
		      console.log(err);  
		      console.log("Query failed");  
		    }        
		  });
		}
	});
}