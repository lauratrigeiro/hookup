var socket_io = require('socket.io');

var chats_api = require('./chats');
//var utils = require('./utils');

function init(server) {
	var io = socket_io.listen(server);

	var chats = {};	// username : socket

	io.on('connection', function(socket) {
		console.log('a user connected');

		socket.on('new sexpert', function() {
			socket.join('sexperts');
		});

		socket.on('user join', function(data) {
			var chat_id = data;
			socket.chat_id = chat_id;
			socket.type = 'user';
			chats[chat_id] = {};
			chats[chat_id]['user'] = socket;
			for (var key in chats) {
				for (var i in chats[key]) {
					console.log("chat: " + key + " , " + i);
				}
			}

			io.to('sexperts').emit('update waiting');

	//		console.log("chats: %j", chats);
		});

		socket.on('sexpert join', function(data) {
			var chat_id = data.chat_id;
	//		socket.chat_id = chat_id;
			socket.type = 'sexpert';
			chats[chat_id]['sexpert'] = socket;
			for (var key_2 in chats) {
				for (var i_2 in chats[key_2]) {
					console.log("chat: " + key_2 + " , " + i_2);
				}
			}
			console.log('sexpert join: ' + data.sexpert_id);
			chats[chat_id]['user'].emit('connected to sexpert', data.sexpert_id);
			io.to('sexperts').emit('update waiting');

		});

		socket.on('user message', function(data) {
			// check if user already connected
			// add user to db connected table	-> callback(true/false)
			console.log('user message: ' + socket.chat_id + ', ' + data);
			chats[socket.chat_id]['sexpert'].emit('new message', { message : data, chat_id : socket.chat_id });
			chats_api.new_message(socket.chat_id, 0, data, function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log("new user message: " + result);
				}
			});
			// io.emit('new message', {	// private: use specific socket.emit instead of io
			// 	username : socket.username,
			// 	message  : data.question
			// });
		});

		socket.on('sexpert message', function(data) {
			console.log('sexpert message: ' + data.chat_id + ', ' + data.message);
			chats[data.chat_id]['user'].emit('new message', data.message);
			chats_api.new_message(data.chat_id, 1, data.message, function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log("new sexpert message: " + result);
				}
			});
		});
		// 	io.emit('new message', {
		// //		username : socket.username,
		// 		message  : data
		// 	});
		// });

		socket.on('user end chat', function() {
			var chat_id = socket.chat_id;
			chats_api.disconnect(chat_id, function(err) {
				if (err) {
					console.log(err);
				}

				if (chats[chat_id]['sexpert']) {
					chats[chat_id]['sexpert'].emit('user end chat', chat_id);
				}

				console.log('user end chat ' + chat_id);
				chats[chat_id] = null;
			});
		});

		socket.on('sexpert end chat', function(chat_id) {
			chats_api.disconnect(chat_id, function(err) {
				if (err) {
					console.log(err);
				}

				if (chats[chat_id]['user']) {
					chats[chat_id]['user'].emit('sexpert end chat');
				}

				console.log('sexpert end chat ' + chat_id);
				chats[chat_id] = null;
			});
		});

		socket.on('disconnect', function() {
			console.log('someone disconnected'); // remove username
			if (socket.type === 'sexpert') {
				for (var key in chats) {
					if (chats[key] && chats[key]['sexpert'] && chats[key]['sexpert'] === socket && chats[key]['user']) {
						chats[key]['user'].emit('sexpert disconnected');
					}
				}
				return;
			}

			var chat_id = socket.chat_id;
			if (!chat_id) {
				return;
			}

			var chat = chats[chat_id];
			if (!chat) {
				return;
			}
			if ('user' in chat) {
				var user_socket = chat.user;				
			}

			if ('sexpert' in chat) {
				var sexpert_socket = chat.sexpert;
				if (sexpert_socket) {
					sexpert_socket.emit('user disconnected', chat_id);
				}
			}
	//				delete sexpert_socket;
			// 	}
			// }
//			if (user_socket) {
//				delete user_socket;	
//			}
	//		console.log(JSON.stringify(chats));
//			delete chats[chat_id];
		});

		socket.on('error', function(err) {
			if (err) {
				console.log(err);
			} else {
				console.log('socket server error');
			}
		});
	});
}

exports.init = init;

