var socket_io = require('socket.io');

//var utils = require('./utils');

function init(server) {
	var io = socket_io.listen(server);

	// implement this in db table
	var users = {};	// username : socket

	io.on('connection', function(socket) {
		console.log('a user connected');
		socket.on('send question', function(data) { // data, callback
			// check if user already connected
			// add user to db connected table	-> callback(true/false)
			socket.username = data.username;
			users[socket.username] = socket;
			io.emit('new message', {	// private: use specific socket.emit instead of io
				username : socket.username,
				message  : data.question
			});
		});

		socket.on('send message', function(data) {
			io.emit('new message', {
		//		username : socket.username,
				message  : data
			});
		});

		socket.on('disconnect', function() {
			console.log('user disconnected'); // remove username
		});
	});
}

exports.init = init;

