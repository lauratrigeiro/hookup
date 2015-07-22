var utils = require('./utils');
var db = require('../config/database');

// CONSTANTS
// Possible Story Statuses
var statuses = {
	submitted: 0,
	approved:  1,
	denied:    2
};

// PUBLIC INTERFACE
exports.statuses = statuses;
exports.create = create_story;
exports.approve = approve_story;
exports.deny = deny_story;
exports.upvote = upvote_story;
exports.get_approved = get_approved;
exports.get_unapproved = get_unapproved;
exports.edit = edit_story;


// PUBLIC FUNCTIONS
function create_story(req, res) {
	if (!req.body || !req.body.content || req.body.content.length > 500) {
		return res.status(400).send({
			error      : 'Request must come from a valid session and include content 500 chars or less',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.connect(res, function(conn) {
		var story_id = utils.uuid();
		var user_id = req.user.id;
		var content = req.body.content;
		var q = 'INSERT INTO stories_approved (story_id, user_id, content) VALUES (?, ?, ?)';
		db.query(res, conn, q, [story_id, user_id, content], function() {
			res.status(201).send({ story_id : story_id, content : content });
		});
	});
}

function approve_story(req, res) {
	db.connect(res, function(conn) {
		var story_id = req.body.story_id;
		var q = 'UPDATE stories_approved SET status = ? WHERE story_id = ?';
		db.query(res, conn, q, [statuses.approved, story_id], function() {
			res.status(200).send({ story_id : story_id });
		});
	});
}

function deny_story(req, res) {
	if (!req.body || !req.body.story_id) {
		return res.status(400).send({
			error      : 'Request must include story_id',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.connect(res, function(conn) {
		var story_id = req.body.story_id;
		var q = 'UPDATE stories_approved SET status = ? WHERE story_id = ?';
		db.query(res, conn, q, [statuses.denied, story_id], function() {
			res.status(200).send({ story_id : story_id });
		});
	});
}

function upvote_story(req, res) {
	if (!req.body || !req.body.story_id) {
		return res.status(400).send({
			error      : 'Request must include story_id',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	db.connect(res, function(conn) {
		var story_id = req.body.story_id;
		var user_id = req.user.id;

		// Check if a user has upvoted this story yet
		var q = 'SELECT upvote_id FROM upvotes WHERE story_id = ? and user_id = ?';
		db.query(res, conn, q, [story_id, user_id], false, function(rows) {
			// If they have return 400
			if (rows.length > 0) {
				conn.release();
				return res.status(400).send({
					error      : 'User has already upvoted this story',
					details    : { request : req.body },
					error_type : 'bad request'
				});
			}

			// Otherwise record the upvote
			var upvote_id = utils.uuid();
			var insert_q = 'INSERT INTO upvotes (upvote_id, story_id, user_id) VALUES (?, ?, ?)';
			db.query(res, conn, insert_q, [upvote_id, story_id, user_id], false, function() {
				var update_q = 'UPDATE stories_approved SET upvotes = upvotes + 1 WHERE story_id = ?';
				db.query(res, conn, update_q, [story_id], function() {
					res.status(200).send({ story_id : story_id });
				});
			});
		});
	});
}

function get_approved(req, res) {
	get_stories(req, res, statuses.approved);
}

function get_unapproved(req, res) {
	get_stories(req, res, statuses.submitted);
}

function edit_story(req, res) {
	if (!req.body || !req.body.story_id) {
		return res.status(400).send({
			error      : 'Request must include story_id',
			details    : { request : req.body },
			error_type : 'bad request'
		});
	}

	var story_id = req.body.story_id;
	var content = req.body.content;
	var discussion = req.body.discussion || null;
	db.connect(res, function(conn) {
		var q = 'UPDATE stories_approved SET content = ?, discussion = ? WHERE story_id = ?';
		db.query(res, conn, q, [content, discussion, story_id], function() {
			res.status(200).send({ story_id : story_id });
		});
	});
}

// PRIVATE FUNCTIONS
function get_stories(req, res, story_status) {
	db.connect(res, function(conn) {
		var offset;
		if ('offset' in req.query && req.query.offset && parseInt(req.query.offset) >= 0) {
			offset = parseInt(req.query.offset);
		} else {
			offset = 0;
		}

		var q = '\
					SELECT story_id, content, upvotes, discussion, UNIX_TIMESTAMP(created_ts) created \
					FROM stories_approved WHERE status = ? ORDER BY created_ts DESC \
					LIMIT 10 OFFSET ?';

		db.query(res, conn, q, [story_status, offset], function(rows) {
			var data = rows.map(function(row) {
				return {
					story_id   : row.story_id,
					content    : row.content,
					created    : row.created,
					upvotes    : row.upvotes,
					discussion : row.discussion
				};
			});

			return res.status(200).send(data);
		});
	});
}
