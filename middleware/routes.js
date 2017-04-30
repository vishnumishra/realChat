var bodyParser = require('body-parser');


// requiring Helper file to run helper functions
var helper = require('./helper');
exports.helper = helper;

var method=routes.prototype;

function routes(app,connection,io,sessionInfo){
	app.use(bodyParser.urlencoded({
		extended: true
	}));
	app.use(bodyParser.json());

	// creating array of users.
	var users=[];
	var uid=""; 


	/*
		Socket event starts
	*/
	io.on('connection',function(socket){



		var uIdSocket=socket.request.session.uid;


		//Storing users into array as an object
	    socket.on('userInfo',function(userinfo){
	    	/*
	    		Adding Single socket user into 'uesrs' array
	    	*/

			var should_add=true;
	    	if(users.length == 0){
	    		userinfo.socketId=socket.id;
	    		users.push(userinfo);
	    	}else{
	    		users.forEach(function(element, index, array){
	    			if(element.id == userinfo.id){
			    		should_add=	false;	    		
			    	}
				});
				if (should_add) {
					userinfo.socketId=socket.id;
	    			users.push(userinfo);
			    };
	    	}

	    	var data={
				query:"update user set online='Y' where id='"+userinfo.id+"'",
				connection:connection
			}
			helper.queryRunner(data,function(result){
				/*
		    		Sending list of users to all users
		    	*/
				users.forEach(function(element, index, array){
		    		helper.getUserChatList(element.id,connection,function(dbUsers){
		    			if(dbUsers === null){
		    				io.to(element.socketId).emit('userEntrance',users);
		    			}else{
		    				helper.mergeUsers(users,dbUsers,'no',function(mergedUsers){
		    					io.to(element.socketId).emit('userEntrance',mergedUsers);
		    				});
		    			}	    			
		    		});
				});
			});

	    	

	    	should_add=true;
	    });    

	   	/*
			'sendMsg' will save the messages into DB.
	   	*/
	   	socket.on('sendMsg',function(data_server){

	    	/*
	    		calling saveMsgs to save messages into DB.
	    	*/
	    	helper.saveMsgs(data_server,connection,function(result){

	    		/*
	    			Chechking users is offline or not
	    		*/
	    		if(data_server.socket_id==null){
	    			
	    			/*
	    				If offline update the Chat list of Sender. 
	    			*/
	    			var singleUser=users.find(function(element){
	    				return element.id == data_server.from_id;
	    			});	
	    			/*
	    				Calling 'getUserChatList' to get user chat list
	    			*/
					helper.getUserChatList(singleUser.id,connection,function(dbUsers){
			    		if(dbUsers === null){
			    			io.to(singleUser.socketId).emit('userEntrance',users);
			    		}else{
			    			/*
	    						Calling 'mergeUsers' to merge online and offline users
	    					*/
			    			helper.mergeUsers(users,dbUsers,'no',function(mergedUsers){
			    				io.to(singleUser.socketId).emit('userEntrance',mergedUsers);
			    			});
			    		}	    			
			    	});
				}else{
					/*
	    				If Online send message to receiver.
	    			*/
	    			io.to(data_server.socket_id).emit('getMsg',result);
	    		}
	    	});	    	  	    
	    });
	   

	    /*
	    	Sending Typing notification to user.
	    */
	    socket.on('setTypingNotification',function(data_server){	    			
	    	io.to(data_server.data_socket_fromid).emit('getTypingNotification',data_server);
	    });

	    /*
	    	Removig user when user logs out
	    */
	    socket.on('disconnect',function(){
	    	var spliceId="";
	    	for(var i=0;i<users.length;i++){
				if(users[i].id==uIdSocket){
					if(users[i].socketId==socket.id){					
					  	var data={
							query:"update user set online='N' where id='"+users[i].id+"'",
							connection:connection
						}
						spliceId=i;
						helper.queryRunner(data,function(result){
							users.splice(spliceId,1); //Removing single user
							io.emit('exit',users[spliceId]);
						});
					}
				}				
			}

		});
	});
	/*
		Socket event Ends
	*/


	/*
		get to render Home page 
	*/
	
	app.get('/home',function(req, res){
		sessionInfo=req.session;
		if(!sessionInfo.uid){
			res.redirect("/");	
			res.end();	
		}else{
			/*res.redirect('/home#?id='+sessionInfo.uid);*/
			res.render('home');
			res.end();
		}
	});

	/*
		post to handle get_userinfo request
	*/
	app.post('/get_userinfo', function(req, res){
		var data={
			query:"select id,name,p_photo,online from user where id='"+req.body.uid+"'",
			connection:connection
		}
		helper.queryRunner(data,function(result){
			if(result.length>0) {
				var user_info="";			
				result.forEach(function(element, index, array){
					user_info=element;
				});
		    	result_send={
		    		is_logged:true,
		    		data:user_info,
		    		msg:"OK"
		    	};
		    } else {
		    	result_send={
		    		is_logged:false,
		    		data:null,
		    		msg:"BAD"
		    	};
		    }   
		    res.write(JSON.stringify(result_send));
			res.end();
		});
	});

	/*
		post to handle get_msgs request
	*/
	app.post('/get_msgs', function(req, res){
		/*
	    	Calling 'getMsgs' to get messages
	    */
		helper.getMsgs(req.body,connection,function(result){
			res.write(JSON.stringify(result));
			res.end();
		});		
	});

	/*
		post to handle get_recent_chats request
	*/
	app.post('/get_recent_chats', function(req, res){
		/*
	    	Calling 'getUserChatList' to get user chat list
	    */
		helper.getUserChatList(req.body.uid,connection,function(dbUsers){
			res.write(JSON.stringify(dbUsers));
			res.end();
		});	
	});

	/*
		post to handle get_users_to_chats request
	*/
	app.post('/get_users_to_chats', function(req, res){
		/*
	    	Calling 'getUsersToChat' to get user chat list
	    */
		helper.getUsersToChat(req.body.uid,connection,function(dbUsers){
			/*
				Calling 'mergeUsers' to merge online and offline users
			*/
			helper.mergeUsers(users,dbUsers,'yes',function(mergedUsers){
	    		res.write(JSON.stringify(mergedUsers));
	    		res.end();
	    	});			
		});	
	});
	
	app.get('/logout', function(req, res){
		sessionInfo=req.session;
		var uid=sessionInfo.uid;
		
		var data={
			query:"update user set online='N' where id='"+uid+"'",
			connection:connection
		}
		helper.queryRunner(data,function(result){

			req.session.destroy(function(err) {
				if(err) {
			    	console.log(err);
			  	} else {
			  		io.emit('exit',1);
					res.redirect('/');
			  	}

			});
		});
	});
	
}

method.getroutes=function(){
	return this;
}

module.exports = routes;
