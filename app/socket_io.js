var socket_io = require('socket.io');

//var utils = require('./utils');

function init(server) {
	var io = socket_io.listen(server);

	var chats = {};	// username : socket

	io.on('connection', function(socket) {
		console.log('a user connected');

		socket.on('user join', function(data) {
			var chat_id = data;
			socket.chat_id = chat_id;
			socket.type = 'user';
			chats[chat_id]['user'] = socket;
		});

		socket.on('sexpert join', function(data) {
			var chat_id = data.chat_id;
			socket.chat_id = chat_id;
			socket.type = 'sexpert';
			chats[chat_id]['sexpert'] = socket;
			chats[chat_id]['user'].emit('connected to sexpert', data.sexpert_id);
		});

		socket.on('user message', function(data) {
			// check if user already connected
			// add user to db connected table	-> callback(true/false)
			chats[socket.chat_id]['sexpert'].emit(data);
			// io.emit('new message', {	// private: use specific socket.emit instead of io
			// 	username : socket.username,
			// 	message  : data.question
			// });
		});

		socket.on('sexpert message', function(data) {
			chats[socket.chat_id]['user'].emit(data);
		});
		// 	io.emit('new message', {
		// //		username : socket.username,
		// 		message  : data
		// 	});
		// });

		socket.on('disconnect', function() {
			console.log('user disconnected'); // remove username
			var chat_id = socket.chat_id;
			var chat = chats[chat_id];
			var sexpert_socket = chat.sexpert;
			var user_socket = chat.user;
			if (socket.type === 'user') {
				if (sexpert_socket) {
					sexpert_socket.emit('user disconnected');
				}
			} else if (socket.type === 'sexpert') {
				if (user_socket) {
					user_socket.emit('sexpert disconnected');
				}

				delete sexpert_socket;
			} else {
				return;
			}

			delete user_socket;
			delete chats[chat_id];
		});
	});
}

exports.init = init;

