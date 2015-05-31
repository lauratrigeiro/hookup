var db = require('../config/database');

function get_sexperts(req, res) {
	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var querystring = 'SELECT a.*, b.username from sexperts a \
			INNER JOIN users b \
			ON a.sexpert_id = b.id \
			WHERE test = 0';

		conn.query(querystring, [], function(err, rows) {
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			var data = rows.map(function(row) {
				var experience;
				if (row.experience === 1) {
					experience = '1 year';
				} else {
					experience = row.experience + ' years';
				}

				return {
					sexpert_id : row.sexpert_id,
					username   : row.username,
					experience : experience,
					bio        : row.bio,
					active     : row.active ? true : false
				};
			});

			return res.status(200).send(data);
		});
	});
}

function get_active(req, res) {
	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		var querystring = 'SELECT COUNT(*) as count from sexperts \
			WHERE active = 1';

		conn.query(querystring, [], function(err, rows) {
			if (err || !rows) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			res.send(200, { active : rows[0].count });
		});
	});
}

function change_active_status(req, res) {
	if (!req.body || !('active' in req.body)) {
		return res.status(400).send({
			error      : 'Request must contain active status',
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

		var active = req.body.active ? 1 : 0;
		var querystring = 'UPDATE sexperts SET active = ? WHERE sexpert_id = ?';
		var params = [active, req.user.id];
		conn.query(querystring, params, function(err, rows) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			return res.status(200).send({ active : active });
		});
	});
}

exports.change_active_status = change_active_status;
exports.get = get_sexperts;
exports.get_active = get_active;