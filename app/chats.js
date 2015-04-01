var utils = require('./utils');

var db = require('../config/database');

function create_chat(req, res) {
	if (!req.body || !req.body.content) {
		return res.status(400).send({
			error      : 'Request must come from a valid session and include content',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var chat_id = utils.uuid();
		var user_id = req.user.id;
		var querystring = 'INSERT INTO chats (chat_id, user_id) VALUES (?, ?)';
		conn.query(querystring, [chat_id, user_id], function(err, rows, fields) {
			if (err) {
				conn.release();
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			req.chat_id = chat_id;

			var message_id = utils.uuid();
			var content = req.body.content;
			var msg_querystring = 'INSERT INTO messages (message_id, chat_id, content) VALUES (?, ?, ?)';
			conn.query(msg_querystring, [message_id, chat_id, content], function(err, rows, fields) {
				conn.release();
				if (err) {
					return res.status(502).send({
						error      : 'database error',
						details    : err,
						error_type : 'database query'
					});
				}

				return res.status(201).send({ chat_id : chat_id, content : content });
			});
		});
	});
}

function new_message(req, res) {
	if (!req.body || !req.body.chat_id || !req.body.content) {
		return res.status(400).send({
			error      : 'Request must include chat_id, content',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var message_id = utils.uuid();
		var sender = 0;
		if (req.user.sexpert) {
			sender = 1;
		}

		var querystring = 'INSERT INTO messages (message_id, chat_id, sender, content) VALUES (?, ?, ?, ?)';
		var params = [message_id, req.body.chat_id, sender, req.body.content];
		conn.query(querystring, params, function(err, rows, fields) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			return res.status(201).send({ message_id : message_id, content : content });
		});
	});
}

function connect(req, res) {
	if (!req.body || !req.body.chat_id || !req.body.user_id) {
		return res.status(400).send({
			error      : 'Request must include chat_id, user_id',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var chat_id = req.body.chat_id;
		var querystring = 'UPDATE chats SET sexpert_id = ? WHERE chat_id = ?';
		conn.query(querystring, [req.user.id, chat_id], function(err, rows, fields) {
			if (err) {
				conn.release();
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			get_user_by_id(req.body.user_id, conn, false, res, function(user) {
				var data = {
					username : user.username,
					age      : user.age
				};

				return res.status(200).send(data);
			});
		});
	});
}

function disconnect(req, res) {
	if (!req.body || !req.body.chat_id) {
		return res.status(400).send({
			error      : 'Request must include chat_id',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var chat_id = req.body.chat_id;
		var querystring = 'UPDATE chats SET closed_ts = CURRENT_TIMESTAMP WHERE chat_id = ?';
		conn.query(querystring, [chat_id], function(err, rows, fields) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			return res.status(200).send({ chat_id : chat_id });
		});
	});
}

function get_user_by_id(user_id, conn, keep_connection, res, callback) {
	var get_querystring = 'SELECT * from users WHERE id = ?';
	conn.query(get_querystring, [user_id], function(err, rows, fields) {
		if (err) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : err,
				error_type : 'database query'
			});
		} else if (!rows || rows.length === 0) {
			conn.release();
			return res.status(400).send({
				error      : 'Request must contain a valid id',
				details    : { request : user_id },
				error_type : 'bad request'
			});
		} else {
			if (!keep_connection) {
				conn.release();
			}
			var row = rows[0];
			callback(row);
		}
	});
}

function get_sexpert_info(req, res) {
	if (!req.query || !req.query.id) {
		return res.status(400).send({
			error      : 'Request must include id',
			details    : { request : req.query },
			error_type : 'bad request'
		});
	}

	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var user_id = req.query.id;
		get_user_by_id(user_id, conn, false, res, function(user) {
			if (!user.sexpert) {
				return res.status(400).send({
					error      : 'This user_id does not belong to a sexpert',
					details    : { request : user_id },
					error_type : 'bad request'
				});
			}

			var data = {
				username       : user.username,
				experience     : user.experience,
				bio            : user.bio
			};

			return res.status(200).send(data);
		});
	});
}

function get_waiting_chats(req, res) {
	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var querystring = 'SELECT chat_id, created_ts FROM chats  \
			WHERE sexpert_id IS NULL AND closed_ts IS NULL        \
			ORDER BY created_ts ASC';
		conn.query(querystring, [], function(err, rows, fields) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			var data = rows.map(function(row) {
				return {
					chat_id    : row.chat_id,
					user_id    : row.user_id,
					created_ts : row.created_ts
				};
			});

			return res.status(200).send(data);
		});
	});
}

function get_first_message(req, res) {
	db.get_connection(function(error, conn) {
		if (!req.query || !req.query.id) {
			return res.status(400).send({
				error      : 'Request must include id',
				details    : { request : req.query },
				error_type : 'bad request'
			});
		}

		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var chat_id = req.query.id;
		var querystring = 'SELECT content, created_ts FROM messages  \
			WHERE chat_id = ?';
		conn.query(querystring, [chat_id], function(err, rows, fields) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			if (!rows || rows.length == 0) {
				return res.status(400).send({
					error      : 'No messages associated with this chat id',
					details    : { request : chat_id },
					error_type : 'bad request'
				});
			}

			var row = rows[0];
			var data = {
				content    : row.content,
				created_ts : row.created_ts
			};

			return res.status(200).send(data);
		});
	});
}

exports.create = create_chat;
exports.new_message = new_message;
exports.connect = connect;
exports.disconnect = disconnect;
exports.sexpert = get_sexpert_info;
exports.waiting = get_waiting_chats;
exports.first = get_first_message;