var utils = require('./utils');
var db = require('../config/database');

// CONSTANTS
// Possible Story Statuses
var statuses = {
  submitted: 0,
  approved:  1,
  denied:    2
}

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

  connect_to_db(function(conn) {
    var story_id = utils.uuid(),
        user_id = req.user.id,
        content = req.body.content,
        q = 'INSERT INTO stories_approved (story_id, user_id, content, created_ts) VALUES (?, ?, ?, NOW())';
    query(conn, q, [story_id, user_id, content], function() {
      res.status(201).send({ story_id : story_id, content : content });
    });
  });
}

function approve_story(req, res) {
  connect_to_db(function(conn) {
    var story_id = req.body.story_id,
        q = 'UPDATE stories_approved SET status = ? WHERE story_id = ?';
    query(conn, q, [statuses.approved, story_id], function(){
      res.status(200).send();
    });
  });
}

function deny_story(req, res) {
  connect_to_db(function(conn) {
    var story_id = req.body.story_id,
        q = 'UPDATE stories_approved SET status = ? WHERE story_id = ?';
    query(conn, q, [statuses.denied, story_id], function(){
      res.status(200).send();
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

  connect_to_db(function(conn){
    var story_id = req.body.story_id,
        user_id = req.user.id;

    // Check if a user has upvoted this story yet
    var q = 'SELECT upvote_id FROM upvotes WHERE story_id = ? and user_id = ?';
    query(conn, q, [story_id, user_id], function(rows, fields) {
      // If they have return 400
      if (rows.length > 0) {
        return res.status(400).send({
          error      : 'User has already upvoted this story',
          details    : { request : req.body },
          error_type : 'bad request'
        });
      }

      connect_to_db(function(conn){
        // Otherwise record the upvote
        var upvote_id = utils.uuid(),
            q = 'INSERT INTO upvotes (upvote_id, story_id, user_id) VALUES (?, ?, ?)';
        query(conn, q, [upvote_id, story_id, user_id], function(rows, fields) {
          return res.status(200).send();
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
  var story_id = req.body.story_id;
  var content = req.body.content;
  var discussion = req.body.discussion || null;
  connect_to_db(function(conn){
    var q = 'UPDATE stories_approved SET content = ?, discussion = ? WHERE story_id = ?';
    query(conn, q, [content, discussion, story_id], function() {});
    return res.status(200).send();
  });
}

// PRIVATE FUNCTIONS
function get_stories(req, res, story_status) {
  connect_to_db(function(conn) {

    if ('offset' in req.query && req.query.offset && parseInt(req.query.offset) >= 0) {
      offset = parseInt(req.query.offset);
    } else {
      offset = 0;
    }

    var q = '\
          SELECT story_id, content, upvotes, discussion, UNIX_TIMESTAMP(created_ts) created \
          FROM stories_approved WHERE status = ? ORDER BY created_ts DESC \
          LIMIT 10 OFFSET ?';

    query(conn, q, [story_status, offset], function(rows, fields) {
      var data = rows.map(function(row) {
        return row_data = {
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
// Boilerplate
// Eventually pull this out into a library
function connect_to_db(callback){
  db.get_connection(function(error, conn) {
    if (error) {
      conn.release();
      return res.status(502).send({
        error      : 'database error',
        details    : error,
        error_type : 'database connection'
      });
    } else {
      callback(conn);
    }
  });
}

function query(conn, q, params, callback){
  conn.query(q, params, function(error, rows, fields){
    console.log(error);
    conn.release();
    if(error) return generic_query_error(err, conn);
    callback(rows, fields);
  });
}

function generic_query_error(err,conn){
  return res.status(502).send({
    error      : 'database error',
    details    : err,
    error_type : 'database query'
  });
}


