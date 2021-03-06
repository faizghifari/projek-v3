
module.exports = function(app) {
	// load modules and models
	var chat = require('./models/chat');
	var driver = require('./models/driver');
	var firebaseToken = require('./models/firebasetoken');
	var http = require('http');
	var fs = require('fs');

	// REST FOR FIREBASE TOKEN
	app.post('/configure_token', function(req,res) {
		firebaseToken.findOne({username: req.body.username}, function(err, found_token) {
			console.log(found_token);
			if (err) {
				var response = {status : 503, message : 'Database error detected'};
				res.json(response);
			}
			else {
				if (!found_token) {
					var addUserToken = new firebaseToken({
						username: req.body.username,
						token: req.body.token
					});

					addUserToken.save(function(error) {
						if (error) throw error;
					});
					
					var response = {status: 200, message: 'User token added successfully'};
					res.json(response);

				} else {
					found_token["token"] = req.body.token;
					found_token.save(function(error) {
						if (error) throw error;
					});
					var response = {status: 200, message: 'User token changed successfully'};
					res.json(response);
				}
			}
		});
	});

	app.post('/remove_token', function(req,res) {
		firebaseToken.findOne({username: req.body.username, token: req.body.token}, function(err, found_token) {
			if (err) {
				var response = {status : 503, message : 'Database error detected'};
				res.json(response);
			}
			else {
				found_token.remove();
				var response = {status: 200, message: 'User token deleted successfully'};
				res.json(response);
			}
		});
	});

	// REST FOR DRIVER MODELS
	app.get('/find_driver', function(req,res) {
		driver.find({status: 'available'}, function(err, available_driver) {
			if (err) throw err;
			res.json(available_driver);
		});
	});

	app.post('/find_order', function(req,res) {
		driver.findOne({driver_username: req.body.username}, function(err, found_driver) {
			if (err) {
				var response = {status : 503, message : 'Database error detected'};
				res.json(response);
			}
			else {
				if (!found_driver) {
						var addDriver = driver({
							driver_username: req.body.username,
							status: 'available'
						});

						addDriver.save(function(error) {
							if (error) throw error;
						});
						var response = {status: 200, message: 'Driver added and its status changed to available successfully'};
						res.json(response);	
				} else {
					found_driver.status = 'available';
					found_driver.save(function(error) {
						if (error) throw error;
					});
					var response = {status: 200, message: 'Driver status changed to available successfully'};
					res.json(response);
				}
			}
		});
	});

	app.post('/starting_order', function(req,res) {
		driver.findOne({driver_username: req.body.username, status: 'available'}, function(err, found_driver) {
			if (err) {
				var response = {status : 503, message : 'Database error detected'};
				res.json(response);
			}
			else {
				found_driver.status = 'busy';
				found_driver.save(function(error) {
					if (error) throw error;
				});
				var response = {status: 200, message: 'Driver status changed to busy successfully'};
				res.json(response);
			}
		});
	});

	app.post('/finishing_order', function(req,res) {
		driver.findOne({driver_username: req.body.username, status: 'busy'}, function(err, found_driver) {
			if (err) {
				var response = {status : 503, message : 'Database error detected'};
				res.json(response);
			}
			else {
				found_driver.status = 'inactive';
				found_driver.save(function(error) {
					if (error) throw error;
				});
				var response = {status: 200, message: 'Driver status changed to inactive successfully'};
				res.json(response);
			}
		});
	});

// 	 REST FOR CHAT FEATURES

	app.post('/sendmessageptod', function(req,res) {
		var message = req.body.message;
		var sender_token = req.body.token;
		var rcv_uname = req.body.rcv_username;
		firebaseToken.findOne({username: rcv_uname}, function(error, rcv_token) {
			if (error) {
				var response = {status : 503, message : 'Database error detected, problem on send message 1'};
				res.json(response);
			} else {
				firebaseToken.findOne({token: sender_token}, function(error1, sender_uname) {
					if (error1) {
						var response = {status : 503, message : 'Database error detected, problem on send message 2'};
						res.json(response);
					} else {
						chat.findOne({user_passenger: sender_uname.username, user_driver: rcv_uname}, function(error2, chat_details) {
							if (error2) {
								var response = {status : 503, message : 'Database error detected, problem on send message 3'};
								res.json(response);
							} else {
								if (!chat_details) {
									var addConversation = chat({
										user_passenger: sender_uname.username,
										user_driver: rcv_uname,
										message_body: [{from: sender_uname.username, to: rcv_uname, msg: message}]
									});
									addConversation.save();
									var response = {"status" : 200, "message" : "Conversation created and message sent to driver successfully"};
									res.json(response);
								} else {
									chat_details.message_body.push({from: sender_uname, to: rcv_uname, msg: message});
									chat_details.save();
									var response = {"status" : 200, "message" : "Message sent to driver successfully"};
									res.json(response);
								}
							}
						})
					}
				});
			}
		});
	});

	app.post('/sendmessagedtop', function(req,res) {
		var message = req.body.message;
		var sender_token = req.body.token;
		var rcv_uname = req.body.rcv_username;
		firebaseToken.findOne({username: rcv_uname}, function(error, rcv_token) {
			if (error) {
				var response = {status : 503, message : 'Database error detected, problem on send message 1'};
				res.json(response);
			} else {
				firebaseToken.findOne({token: sender_token}, function(error1, sender_uname) {
					if (error1) {
						var response = {status : 503, message : 'Database error detected, problem on send message 2'};
						res.json(response);
					} else {
						chat.findOne({user_passenger: rcv_uname, user_driver: sender_uname.username}, function(error2, chat_details) {
							if (error2) {
								var response = {status : 503, message : 'Database error detected, problem on send message 3'};
								res.json(response);
							} else {
								if (!chat_details) {
									var addConversation = chat({
										user_passenger: rcv_uname,
										user_driver: sender_uname.username,
										message_body: [{from: sender_uname.username, to: rcv_uname, msg: message}]
									});
									addConversation.save();
									var response = {"status" : 200, "message" : "Conversation created and message sent to passenger successfully"};
									res.json(response);
								} else {
									chat_details.message_body.push({from: sender_uname, to: rcv_uname, msg: message});
									chat_details.save();
									var response = {"status" : 200, "message" : "Message sent to passenger successfully"};
									res.json(response);
								}
							}
						})
					}
				});
			}
		});
	});

	// route to handle all angular requests
	app.get('*', function(req, res) {
		res.send('./public/index.html');
	});
};



