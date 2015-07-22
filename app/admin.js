var db = require('../config/database');

function get_user(req, res) {
	if (!req.query || !req.query.name) {
		return res.status(400).send({
			error      : 'Request must contain a username',
			details    : { request : req.query },
			error_type : 'bad request'
		});
	}

	db.connect(res, function(conn) {
		var username = req.query.name;
		get_user_info(username, conn, true, res, function(data) {
			return res.status(200).send(data);
		});
	});
}

function get_user_info(username, conn, release_connection, res, callback) {
	var querystring = 'SELECT * from users WHERE username = ?';
	db.query(res, conn, querystring, [username], release_connection, function(rows) {
		if (!rows || !rows.length) {
			if (!release_connection) {
				conn.release();
			}

			return res.status(400).send({
				error      : 'Request must contain a valid username',
				details    : { username : username },
				error_type : 'bad request'
			});
		}

		var row = rows[0];
		var data = {
			id       : row.id,
			username : row.username,
			email    : row.email,
			age      : row.age,
			sexpert  : row.sexpert,
			employee : row.employee,
			admin    : row.admin
		};

		callback(data);
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

	db.connect(res, function(conn) {
		var querystring = 'UPDATE users SET ' + user_type + ' = 1 WHERE username = ?';
		db.query(res, conn, querystring, [username], function() {
			res.status(200).send({ msg : 'Update successful' });
		});
	});
}

function add_profile(req, res) {
	if (!req.body || !req.body.username || !req.body.experience || !req.body.bio) {
		return res.status(400).send({
			error      : 'Request must contain a username, experience, and bio',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.connect(res, function(conn) {
		var username = req.body.username;
		get_user_info(username, conn, false, res, function(user) {
			if (!user.sexpert) {
				conn.release();
				return res.status(400).send({
					error      : 'username must belong to a sexpert',
					details    : { request : req.username },
					error_type : 'bad request'
				});
			}

			var experience = req.body.experience;
			var bio = req.body.bio;
			var querystring = 'UPDATE users SET experience = ?, bio = ? WHERE username = ?';
			var params = [experience, bio, username];
			db.query(res, conn, querystring, params, function() {
				res.status(200).send({ msg : 'Update successful' });
			});
		});
	});
}

exports.get_user = get_user;
exports.upgrade_user = upgrade_user;
exports.add_profile = add_profile;
