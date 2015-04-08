var utils = require('./utils');
var db = require('../config/database');




function create_story(req, res) {
	if (!req.body || !req.body.content || req.body.content.length > 500) {
		return res.status(400).send({
			error      : 'Request must come from a valid session and include content 500 chars or less',
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

		var story_id = utils.uuid();
		var user_id = req.user.id;
		var content = req.body.content;
		var querystring = 'INSERT INTO stories_unapproved (story_id, user_id, content) VALUES (?, ?, ?)';
		conn.query(querystring, [story_id, user_id, content], function(err, rows, fields) {
			conn.release();
			if (err) {
				conn.release();
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			return res.status(201).send({ story_id : story_id, content : content });
		});
	});
}

function approve_story(req, res) {
	upvote(req, res, true);
}

function user_upvote(req, res) {
	upvote(req, res, false);
}

function upvote(req, res, approve) {
	if (!req.body || !req.body.story_id) {
		return res.status(400).send({
			error      : 'Request must include story_id',
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

		var story_id = req.body.story_id;
		var user_id = req.user.id;

		var select_querystring = 'SELECT upvote_id FROM upvotes WHERE story_id = ? and user_id = ?';
		conn.query(select_querystring, [story_id, user_id], function(err, rows, fields) {
			if (err) {
				conn.release();
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			} else if (rows.length > 0) {
				conn.release();
				return res.status(400).send({
					error      : 'User has already upvoted this story',
					details    : { request : req.body },
					error_type : 'bad request'
				});
			}

			if (!approve) {
				querystring = 'UPDATE stories_approved SET upvotes = upvotes + 1, approved = 1 WHERE story_id = ?';
			} else {
				querystring = 'INSERT INTO stories_approved (story_id, user_id, content, created_ts) \
					SELECT story_id, user_id, content, created_ts from stories_unapproved \
					WHERE story_id = ?';
			}

			conn.query(querystring, [story_id], function(err, rows, fields) {
				if (err) {
					conn.release();
					return res.status(502).send({
						error      : 'database error',
						details    : err,
						error_type : 'database query'
					});
				}

				var upvote_id = utils.uuid();
				var querystring = 'INSERT INTO upvotes (upvote_id, story_id, user_id) VALUES (?, ?, ?)';
				var params = [upvote_id, story_id, user_id];
				conn.query(querystring, params, function(err, rows, fields) {
					if (err) {
						conn.release();
						return res.status(502).send({
							error      : 'database error',
							details    : err,
							error_type : 'database query'
						});
					}

					if (!approve) {
						conn.release();
						return res.status(201).send({ message : 'story upvoted successfully' });
					}

					querystring = 'DELETE FROM stories_unapproved WHERE story_id = ?';
					conn.query(querystring, [story_id], function(err, rows, fields) {
						conn.release();
						if (err) {
							return res.status(502).send({
								error      : 'database error',
								details    : err,
								error_type : 'database query'
							});
						}

						res.status(201).send({ message : 'story approved successfully' });
					});
				});
			});
		});
	});
}



function get_stories(req, res, approved) {
	db.get_connection(function(error, conn) {
		if (error) {
			conn.release();
			return res.status(502).send({
				error      : 'database error',
				details    : error,
				error_type : 'database connection'
			});
		}

		if ('offset' in req.query && req.query.offset && parseInt(req.query.offset) >= 0) {
			offset = parseInt(req.query.offset);
		} else {
			offset = 0;
		}

		var querystring;
		if (approved) {
			querystring = 'SELECT story_id, content, upvotes, UNIX_TIMESTAMP(created_ts) created \
				FROM stories_approved ORDER BY created_ts DESC LIMIT 10 OFFSET ?';
		} else {
			querystring = 'SELECT story_id, content, UNIX_TIMESTAMP(created_ts) created \
				FROM stories_unapproved ORDER BY created_ts ASC LIMIT 10 OFFSET ?';
		}

		conn.query(querystring, [offset], function(err, rows, fields) {
			conn.release();
			if (err) {
				return res.status(502).send({
					error      : 'database error',
					details    : err,
					error_type : 'database query'
				});
			}

			var data = rows.map(function(row) {
				row_data = {
					story_id   : row.story_id,
					content    : row.content,
					created    : row.created
				};

				if (approved) {
					row_data.upvotes = row.upvotes;
				}

				return row_data;
			});

			return res.status(200).send(data);
		});
	});
}

function get_approved(req, res) {
	get_stories(req, res, true);
}

function get_unapproved(req, res) {
	get_stories(req, res, false);
}

exports.create = create_story;
exports.approve = approve_story;
exports.upvote = user_upvote;
exports.get_approved = get_approved;
exports.get_unapproved = get_unapproved;
