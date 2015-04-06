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
			if (!chat_id) {
				console.log('user join with an invalid chat_id');
				return;
			}
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
			if (!chat_id) {
				console.log('sexpert join with an invalid chat_id');
				return;
			}
			socket.type = 'sexpert';
			if (!chats[chat_id]) {
				console.log('sexpert join before user join');	// need to wait?
				return;
			}
			chats[chat_id]['sexpert'] = socket;
			// for (var key_2 in chats) {
			// 	for (var i_2 in chats[key_2]) {
			// 		console.log("chat: " + key_2 + " , " + i_2);
			// 	}
			// }
			console.log('sexpert join: ' + data.sexpert_id);
			chats[chat_id]['user'].emit('connected to sexpert', data.sexpert_id);
			io.to('sexperts').emit('update waiting');

		});

		socket.on('user message', function(data) {
			if (!socket.chat_id) {
				console.log('user tried to end chat with undefined chat_id on socket');
				return;
			}

			if (!data) {
				console.log('user message with undefined data (messasge)');
				return;
			}
			if (!chats[socket.chat_id] || !chats[socket.chat_id]['sexpert']) {
				console.log('users message has undefined users object');
				return;
			}
			console.log('user message: ' + socket.chat_id + ', ' + data);
			chats[socket.chat_id]['sexpert'].emit('new message', { message : data, chat_id : socket.chat_id });
			chats_api.new_message(socket.chat_id, 0, data, function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log("new user message: " + result);
				}
			});
		});

		socket.on('sexpert message', function(data) {
			if (!data || !data.chat_id || !data.message) {
				console.log('sexpert message data must contain valid chat_id and message');
				if (data) { console.log('chat_id: ' + data.chat_id + ', message: ' + data.message); }
				return;
			}
			console.log('sexpert message: ' + data.chat_id + ', ' + data.message);
			if (!chats[data.chat_id] || !chats[data.chat_id]['user']) {
				console.log('sexpert message has undefined users object');
				return;
			}
			chats[data.chat_id]['user'].emit('new message', data.message);
			chats_api.new_message(data.chat_id, 1, data.message, function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log("new sexpert message: " + result);
				}
			});
		});

		socket.on('user end chat', function() {
			var chat_id = socket.chat_id;
			if (!chat_id) {
				console.log('user tried to end chat with undefined chat_id on socket');
				return;
			}

			chats_api.disconnect(chat_id, function(err) {
				if (err) {
					console.log(err);
				}

				if (chats[chat_id] && chats[chat_id]['sexpert']) {
					chats[chat_id]['sexpert'].emit('user end chat', chat_id);
				}

				console.log('user end chat ' + chat_id);
				chats[chat_id] = null;
			});
		});

		socket.on('sexpert end chat', function(chat_id) {
			if (!chat_id) {
				console.log('sexpert tried to end chat with undefined chat_id');
				return;
			}

			chats_api.disconnect(chat_id, function(err) {
				if (err) {
					console.log(err);
				}

				if (chats[chats_id] && chats[chat_id]['user']) {
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

