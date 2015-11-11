// config/database.js

var mysql = require('mysql');

var pool = mysql.createPool({
	connectionLimit : 100,
	host		 : 'HOST',
	user		 : 'USER',
	password : 'PASSWORD',
	database : 'DATABASE',
	debug		: false
});

// TODO: add connection as middleware

function get_connection(callback) {
	pool.getConnection(function(err, conn) {
		if (err) {
			return callback(err);
		}

		callback(null, conn);
	});
}

function connect(res, callback) {
	pool.getConnection(function(err, conn) {
		if (err) {
			return generic_connection_error(res, err, conn);
		}

		callback(conn);
	});
}

function query(res, conn, q, params, release, callback) {
	if (typeof release === 'function') {
		callback = release;
		release = true;
	}

	conn.query(q, params, function(err, rows, fields) {
		if (err) {
			return generic_query_error(res, err, conn);
		}

		if (release) {
			conn.release();
		}

		callback(rows, fields);
	});
}

function generic_connection_error(res, err, conn) {
	conn.release();
	return res.status(502).send({
		error      : 'database error',
		details    : err,
		error_type : 'database connection'
	});
}

function generic_query_error(res, err, conn) {
	conn.release();
	return res.status(502).send({
		error      : 'database error',
		details    : err,
		error_type : 'database query'
	});
}

exports.get_connection = get_connection;
exports.connect = connect;
exports.query = query;
