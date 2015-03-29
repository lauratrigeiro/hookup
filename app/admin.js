var db = require('../config/database');

function get_user(req, res) {
	if (!req.query || !req.query.name) {
		return res.status(400).send({
			error      : 'Request must contain a username',
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

		var username = req.query.name;
		var querystring = 'SELECT * from users WHERE username = ?';
		conn.query(querystring, [username], function(err, rows, fields) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			} else if (!rows || rows.length === 0) {
				return res.status(400).send({
					error      : 'Request must contain a valid username',
					details    : { request : req.query },
					error_type : 'bad request'
				});
			} else {
				var row = rows[0];
				return res.status(200).send({
					id       : row.id,
					username : row.username,
					email    : row.email,
					age      : row.age,
					sexpert  : row.sexpert,
					employee : row.employee,
					admin    : row.admin
				});
			}
		});
	});
}

function upgrade_user(req, res) {
	if (!req.body || !req.body.username || !req.body.user_type) {
		return res.status(400).send({
			error      : 'Request must contain a username and user type',
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

		var username = req.body.username;
		var user_type = req.body.user_type;
		var user_types = ['sexpert', 'employee', 'admin'];
		if (user_types.indexOf(user_type) < 0) {
			return res.status(400).send({
				error      : 'Not a valid user type',
				details    : { request : req.body.user_type },
				error_type : 'bad request'
			});
		}
		var querystring = 'UPDATE users SET ' + user_type + ' = 1 WHERE username = ?';
		conn.query(querystring, [username], function(err, rows, fields) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			return res.status(200).send({ msg : "Update successful" });
		});
	});
}

exports.get_user = get_user;
exports.upgrade_user = upgrade_user;