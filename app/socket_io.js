var socket_io = require('socket.io');

var chats_api = require('./chats');
//var utils = require('./utils');

function init(server) {
	var io = socket_io.listen(server);

	var chats = {};	// username : socket

	io.on('connection', function(socket) {
		console.log('someone connected');

		socket.on('new sexpert', function() {
			socket.join('sexperts');
		});

		socket.on('user join', function(data) {
			var chat_id = data;
			if (!chat_id) {
				console.log('user join with an invalid chat_id');
				return;
			}

			console.log('user join, chat: ' + chat_id);
			socket.chat_id = chat_id;
			socket.type = 'user';
			// sexpert has already joined chat
			if (chats[chat_id] && chats[chat_id].sexpert) {
				chats[chat_id].user = socket;
				console.log('user connected');
				chats[chat_id].sexpert.emit('user connected', { chat_id : chat_id });
				socket.emit('connected to sexpert', data.sexpert_id);
			} else {
				chats[chat_id] = {};
				chats[chat_id].user = socket;
				for (var key in chats) {
					for (var i in chats[key]) {
						console.log('chat: ' + key + ' , ' + i);
					}
				}

				io.to('sexperts').emit('update waiting');
			}
	//		console.log("chats: %j", chats);
		});

		socket.on('sexpert join', function(data) {
			var chat_id = data.chat_id;
			if (!chat_id) {
				console.log('sexpert join with an invalid chat_id');
				return;
			}

			console.log('sexpert join: ' + data.sexpert_id + ', chat: ' + chat_id);
			socket.chat_id = chat_id;
			socket.type = 'sexpert';
			// user already joined socket
			if (chats[chat_id] && chats[chat_id].user) {
				chats[chat_id].sexpert = socket;
				socket.emit('user connected', { chat_id : chat_id });
				chats[chat_id].user.emit('connected to sexpert', data.sexpert_id);
				return;
			}

			chats[chat_id] = {};
			chats[chat_id].sexpert = socket;

			// for (var key_2 in chats) {
			// 	for (var i_2 in chats[key_2]) {
			// 		console.log("chat: " + key_2 + " , " + i_2);
			// 	}
			// }

	//		socket.emit('user status', { online: false, chat_id : chat_id });
	//		chats[chat_id].user.emit('connected to sexpert', data.sexpert_id);
	//		io.to('sexperts').emit('update waiting');
		});

		socket.on('user message', function(data) {
			if (!socket.chat_id) {
				console.log('user tried to send message with undefined chat_id on socket');
				return;
			}

			if (!data) {
				console.log('user message with undefined data (messasge)');
				return;
			}

			var chat_id = socket.chat_id;

			if (!chats[chat_id]) {
				console.log('users message has undefined chats object');
				return;
			}

			console.log('user message: ' + chat_id + ', ' + data);
			// if sexpert is in chat
			if (chats[chat_id].sexpert) {
				chats[chat_id].sexpert.emit('new message', { message : data, chat_id : chat_id });
			} else {
				io.to('sexperts').emit('update waiting');
			}

			chats_api.new_message(chat_id, 0, data, false, function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log('new user message: ' + result);
				}
			});
		});

		socket.on('sexpert message', function(data) {
			if (!data || !data.chat_id || !data.message) {
				console.log('sexpert message data must contain valid chat_id and message');
				if (data) { console.log('chat_id: ' + data.chat_id + ', message: ' + data.message); }
				return;
			}

			var chat_id = data.chat_id;

			console.log('sexpert message: ' + chat_id + ', ' + data.message);
			if (!chats[chat_id]) {
				console.log('sexpert message has undefined chats object');
				return;
			}

			//  user is connected
			if (chats[chat_id].user) {
				chats[chat_id].user.emit('new message', data.message);
			}

			chats_api.new_message(chat_id, 1, data.message, chats[chat_id].user, function(err, result) {
				if (err) {
					console.log(err);
				} else {
					console.log('new sexpert message: ' + result);
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

				if (chats[chat_id] && chats[chat_id].sexpert) {
					chats[chat_id].sexpert.emit('user end chat', chat_id);
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

				if (chats[chat_id] && chats[chat_id].user) {
					chats[chat_id].user.emit('sexpert end chat');
				}

				console.log('sexpert end chat ' + chat_id);
				chats[chat_id] = null;
			});
		});

		socket.on('disconnect', function() {
			console.log('someone disconnected');
			if (!socket.chat_id || !chats[socket.chat_id]) {
				console.log('no socket chat_id to disconnect');
				return;
			}

			var chat_id = socket.chat_id;

			if (socket.type === 'sexpert') {
				if (!chats[chat_id].sexpert) {
					console.log('sexpert disconnected without valid chats object');
					return;
				}

				if (chats[chat_id].user) {
					chats[chat_id].user.emit('sexpert disconnected');
				}

				chats[chat_id].sexpert = null;
				return;
			}

			if (!chats[chat_id].sexpert) {
				console.log('user disconnected without valid chats object');
				return;
			}

			if (chats[chat_id].sexpert) {
				chats[chat_id].sexpert.emit('user disconnected', chat_id);
			}

			chats[chat_id].user = null;
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

