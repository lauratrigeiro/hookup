var db = require('../config/database');

function get(req, res) {
	db.connect(res, function(conn) {
		var querystring = 'SELECT *, \
		DATE_FORMAT(birthday, \'%m/%d/%Y\') AS birthday_formatted \
		FROM users WHERE sexpert = 0 AND employee = 0 AND admin = 0 ORDER BY created_ts DESC';
		db.query(res, conn, querystring, [], function(rows) {
			var data = rows.map(function(row) {
				return {
					id : row.id,
					username   : row.username,
					email      : row.email,
					birthday   : row.birthday_formatted || '',
					zip        : row.zip,
					gender     : row.gender,
					age        : row.age || '',
					created_ts : row.created_ts
				};
			});

			res.status(200).send(data);
		});
	});
}

exports.get = get;
