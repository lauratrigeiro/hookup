var mandrill = require('./mandrill');
var utils = require('./utils');

var db = require('../config/database');

var statuses = {
  submitted: 0,
  approved: 1,
  denied: 2
};

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

function new_message(chat_id, sender, content, user_online, callback) {
	if (!chat_id || !content) {
		return callback('Arguments must be valid: ' + chat_id + ', ' + content);
	}

	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return callback(error);
		}

		var select_querystring;

		// if sender is a sexpert and user is not online, get user's email
		if (sender) {
			select_querystring = 'SELECT \
			a.closed_ts,             \
			b.email                  \
			FROM chats a             \
			INNER JOIN users b       \
				ON a.user_id = b.id    \
			WHERE a.chat_id = ?';
		// if sender is a user, get sexpert's email and if they're online
		} else {
			select_querystring = 'SELECT \
			a.closed_ts,             \
			b.email,                 \
			c.active                 \
			FROM chats a             \
			INNER JOIN users b       \
				ON a.sexpert_id = b.id \
			INNER JOIN sexperts c    \
				ON a.sexpert_id = c.sexpert_id \
			WHERE a.chat_id = ?';
		}

		conn.query(select_querystring, [chat_id], function(select_err, select_rows) {
			if (select_err) {
				conn.release();
				return callback(select_err);
			}

			if (!select_rows.length) {
				conn.release();
				return callback('Invalid chat_id');
			}

			if (select_rows[0].closed_ts) {
				return callback({ closed : true });
			}

			var recipient = select_rows[0];

			var message_id = utils.uuid();
			var querystring = 'INSERT INTO messages (message_id, chat_id, sender, content) VALUES (?, ?, ?, ?)';
			var params = [message_id, chat_id, sender, content];
			conn.query(querystring, params, function(err, rows) {
				conn.release();
				if (err) {
					return callback(err);
				}

				// if sender is a sexpert and user is online, don't send an email
				if (sender && user_online) {
					return callback(null, message_id);
				}

				// if sender is a user and sexpert is online, don't need to send email
				if (!sender && recipient.active) {
					return callback(null, message_id);
				}

				// Otherwise send email to recipient
				if (!sender) {
					mandrill.send_sexpert_chat_notification(select_rows[0].email);
				} else {
					mandrill.send_user_chat_notification(select_rows[0].email, chat_id);
				}

				callback(null, message_id);
			});
		});
	});
}

// function new_message(req, res) {
// 	if (!req.body || !req.body.chat_id || !req.body.content) {
// 		return res.status(400).send({
// 			error      : 'Request must include chat_id, content',
// 			details    : { request : req.body },
// 			error_type : 'bad request'
// 		});
// 	}

// 	db.get_connection(function(error, conn) {
// 		if (error) {
// 			conn.release();
// 			return res.status(502).send({
// 				error      : 'database error',
// 				details    : error,
// 				error_type : 'database connection'
// 			});
// 		}

// 		var message_id = utils.uuid();
// 		var sender = 0;
// 		if (req.user.sexpert) {
// 			sender = 1;
// 		}

// 		var querystring = 'INSERT INTO messages (message_id, chat_id, sender, content) VALUES (?, ?, ?, ?)';
// 		var params = [message_id, req.body.chat_id, sender, req.body.content];
// 		conn.query(querystring, params, function(err, rows, fields) {
// 			conn.release();
// 			if (err) {
// 				return res.status(502).send({
// 					error      : 'database error',
// 					details    : err,
// 					error_type : 'database query'
// 				});
// 			}

// 			return res.status(201).send({ message_id : message_id, content : content });
// 		});
// 	});
// }

function select_sexpert(req, res) {
	if (!req.body || !req.body.chat_id || !req.body.sexpert_id) {
		return res.status(400).send({
			error      : 'Request must include chat_id, user_id, sexpert_id',
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
		var sexpert_id = req.body.sexpert_id;
		var querystring = 'UPDATE chats SET sexpert_id = ? \
		WHERE chat_id = ? AND user_id = ? AND sexpert_id IS NULL';

		conn.query(querystring, [sexpert_id, chat_id, req.user.id], function(err, rows) {
			if (err) {
				conn.release();
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			if (!rows.changedRows) {
				conn.release();
				return res.status(403).send({
					error      : 'User does not have permission to view this chat or sexpert already selected',
					details    : null,
					error_type : 'forbidden'
				});
			}

			conn.query('SELECT email from users where id = ?', [sexpert_id], function(inner_err, inner_rows) {
				conn.release();
				if (inner_err) {
					return res.status(502).send({
						error      : 'database error',
						details    : inner_err,
						error_type : 'database query'
					});
				}

				if (!inner_rows || !inner_rows.length) {
					return res.status(400).send({
						error      : 'Invalid sexpert_id',
						details    : { sexpert_id : sexpert_id },
						error_type : 'bad request'
					});
				}

				res.status(200).send({ chat_id : chat_id, sexpert_id : sexpert_id });
				console.log(req.headers.host);
				if (req.headers.host !== 'localhost:3000')
					mandrill.send_sexpert_chat_notification(inner_rows[0].email);
			});
		});
	});
}

function connect(req, res) {
	if (!req.body || !req.body.chat_id) {
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

function disconnect(chat_id, callback) {
	if (!chat_id) {
		return callback('Not a valid chat_id');
	}

	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return callback(error);
		}

		var querystring = 'UPDATE chats SET closed_ts = CURRENT_TIMESTAMP WHERE chat_id = ?';
		conn.query(querystring, [chat_id], function(err, rows, fields) {
			conn.release();
			if (err) {
				return callback(err);
			}

			callback();
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

			var experience;
			if (user.experience === 1) {
				experience = '1 year';
			} else {
				experience = user.experience + ' years';
			}

			var data = {
				username       : user.username,
				experience     : experience,
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

		var querystring = 'SELECT \
			a.chat_id,            \
			a.user_id,            \
			a.created_ts,         \
			b.username,           \
			b.age,                \
			c.content             \
			FROM chats a          \
			INNER JOIN users b    \
				ON a.user_id = b.id      \
			INNER JOIN messages c        \
				ON a.chat_id = c.chat_id \
			WHERE a.sexpert_id IS NULL AND a.closed_ts IS NULL \
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
					created_ts : row.created_ts.toString().slice(0, 25) + 'UTC',
					username   : row.username,
					age        : row.age,
					content    : row.content
				};
			});

			return res.status(200).send(data);
		});
	});
}

function get_open_chats_by_sexpert(req, res) {
	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var querystring = 'SELECT \
			a.chat_id,            \
			a.user_id,            \
			b.username,           \
			b.age,                \
			c.content,            \
			c.sender,             \
			c.created_ts          \
			FROM chats a          \
			INNER JOIN users b    \
				ON a.user_id = b.id      \
			INNER JOIN messages c        \
				ON a.chat_id = c.chat_id \
			WHERE a.sexpert_id = ? AND a.closed_ts IS NULL \
			AND c.created_ts =  (                          \
				SELECT MAX(d.created_ts) FROM messages d     \
				WHERE c.chat_id = d.chat_id                  \
			)                                              \
			ORDER BY a.created_ts ASC';
		conn.query(querystring, [req.user.id], function(err, rows) {
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
					created_ts : row.created_ts.toString().slice(0, 25) + 'UTC',
					username   : row.username,
					age        : row.age,
					content    : row.content,
					sender     : row.sender
				};
			});

			return res.status(200).send(data);
		});
	});
}

function get_open_chats_by_user(req, res) {
	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var querystring = 'SELECT \
			a.chat_id,            \
			b.username as sexpert_username, \
			c.content,            \
			UNIX_TIMESTAMP(c.created_ts) as created_ts \
			FROM chats a          \
			INNER JOIN users b    \
				ON a.sexpert_id = b.id   \
			INNER JOIN messages c      \
				ON a.chat_id = c.chat_id \
			WHERE a.user_id = ? AND a.closed_ts IS NULL    \
			AND c.created_ts =  (                          \
				SELECT MIN(d.created_ts) FROM messages d     \
				WHERE c.chat_id = d.chat_id                  \
			)                                              \
			ORDER BY a.created_ts ASC';

		conn.query(querystring, [req.user.id], function(err, rows) {
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
					chat_id            : row.chat_id,
					sexpert_username   : row.sexpert_username,
					content            : row.content,
					created_ts         : row.created_ts
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
		var querystring = 'SELECT a.content, a.created_ts FROM messages a  \
			INNER JOIN chats b           \
				ON a.chat_id = b.chat_id \
			WHERE a.chat_id = ?          \
			AND b.sexpert_id IS NULL     \
			AND b.closed_ts IS NULL';
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
					error      : 'No messages associated with this chat id or it is already closed',
					details    : { request : chat_id },
					error_type : 'bad request'
				});
			}

			var row = rows[0];
			var data = {
				content    : row.content,
				created_ts : row.created_ts.toString().slice(0, 25) + 'UTC'
			};

			return res.status(200).send(data);
		});
	});
}

function get_chat_messages(req, res) {
	if (!req.params || !req.params.id) {
		return res.status(400).send({
			error      : 'Request must include id',
			details    : { request : req.params },
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

		var chat_id = req.params.id;
		var querystring = 'SELECT      \
			UNIX_TIMESTAMP(a.closed_ts) as closed_ts, \
			a.user_id,                   \
			a.sexpert_id,                \
			a.display_username,          \
			b.age as user_age,           \
			b.username,                  \
			c.username as sexpert_username, \
			d.sender,                    \
			d.content,                   \
			UNIX_TIMESTAMP(d.created_ts) as created_ts \
			FROM chats a                 \
			INNER JOIN users b           \
				ON a.user_id = b.id        \
			INNER JOIN users c           \
				ON a.sexpert_id = c.id     \
			INNER JOIN messages d        \
				ON a.chat_id = d.chat_id   \
			WHERE a.chat_id = ?          \
			ORDER BY created_ts ASC';

		conn.query(querystring, [chat_id], function(err, rows) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			if (!rows || !rows.length) {
				return res.status(400).send({
					error      : 'No messages associated with this chat id',
					details    : { request : chat_id },
					error_type : 'bad request'
				});
			}

			var first_row = rows[0];
			if (!req.user.employee && ((req.user.sexpert && req.user.id !== first_row.sexpert_id) || (!req.user.sexpert && req.user.id !== first_row.user_id))) {
				return res.status(403).send({
					error      : 'User does not have permission to view this chat',
					details    : null,
					error_type : 'forbidden'
				});
			}

			var data = {};
			data.closed_ts = first_row.closed_ts;
			data.username = first_row.username;
			data.display_username = first_row.display_username;
			data.user_age = first_row.user_age;
			data.sexpert_id = first_row.sexpert_id;
			data.sexpert_username = first_row.sexpert_username;
      data.chat_id = chat_id;

			data.messages = rows.map(function(row) {
				var sender;
				if (row.sender) {
					sender = 'Sexpert';
				} else {
					sender = 'User';
				}

				return {
					sender     : sender,
					content    : row.content,
					created_ts : row.created_ts
				};
			});

			return res.status(200).send(data);
		});
	});
}

function get_submitted_chats(req, res) {
  get_all_chats(req, res, statuses.submitted);
}

function get_approved_chats(req, res) {
  get_all_chats(req, res, statuses.approved);
}

function get_all_chats(req, res, status, open) {
	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var querystring = 'SELECT      \
			a.chat_id,                   \
      a.status, \
      a.display_username,          \
			d.age AS user_age,           \
			c.username AS sexpert_username, \
			(SELECT COUNT(b.message_id)  \
				FROM messages b            \
				WHERE a.chat_id = b.chat_id) AS messages, \
			UNIX_TIMESTAMP(d.created_ts) as created_ts, \
			UNIX_TIMESTAMP(a.closed_ts) as closed_ts    \
			FROM chats a                                \
			INNER JOIN users c            \
				ON a.sexpert_id = c.id     \
			INNER JOIN users d           \
				ON a.user_id = d.id';

      if(status || status === 0){
        querystring += " WHERE a.status = " + status;
        if (!open) {
        	querystring += ' AND a.closed_ts IS NOT NULL';
        }
      } else if (!open) {
      	querystring += ' WHERE a.closed_ts IS NOT NULL';
      }
			querystring += ' ORDER BY created_ts DESC';

		conn.query(querystring, [], function(err, rows) {
			conn.release();
			if (err) {
        console.log(err)
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			var data = rows.map(function(row) {
				return {
					chat_id          : row.chat_id,
					user_age         : row.user_age,
					display_username : row.display_username,
					sexpert_username : row.sexpert_username,
					messages         : row.messages,
					created_ts       : row.created_ts,
					closed_ts        : row.closed_ts,
          status           : row.status
				};
			});

			return res.status(200).send(data);
		});
	});
}

function deny_chat(req, res){
  set_chat_status(req, res, statuses.denied);
}

function approve_chat(req, res){
  set_chat_status(req, res, statuses.approved);
}

function set_chat_status(req, res, status){
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
    var querystring = 'UPDATE chats SET status = ? WHERE chat_id = ?';

    conn.query(querystring, [status, chat_id], function(err, rows, fields) {
      conn.release();
      if (err) {
        return res.status(502).send({
          error      : 'database error',
          details    : err,
          error_type : 'database query'
        });
      }

      res.status(200).send();
    });
  });
}

function set_display_username(req, res) {
	if (!req.body || !req.body.chat_id || !('display_username' in req.body)) {
		return res.status(400).send({
			error      : 'Request must include chat_id, display_username',
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
    var display_username = req.body.display_username || '';
    var querystring = 'UPDATE chats SET display_username = ? WHERE chat_id = ?';

    conn.query(querystring, [display_username, chat_id], function(err, rows, fields) {
      conn.release();
      if (err) {
        return res.status(502).send({
          error      : 'database error',
          details    : err,
          error_type : 'database query'
        });
      }

      res.status(200).send({ result : 'Success' });
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
exports.get_chat_messages = get_chat_messages;
exports.get_all_chats = get_all_chats;
exports.get_pending_chats = get_submitted_chats;
exports.get_approved_chats = get_approved_chats;
exports.select_sexpert = select_sexpert;
exports.get_open_chats_by_sexpert = get_open_chats_by_sexpert;
exports.get_open_chats_by_user = get_open_chats_by_user;
exports.approve_chat = approve_chat;
exports.deny_chat = deny_chat;
exports.set_display_username = set_display_username;
