var mc_api = require('mailchimp-api');

var mc_api_key = 'API_KEY';
var mc = new mc_api.Mailchimp(mc_api_key);

function subscribe(request, response) {
	if (!request.body || !request.body.email) {
		return response.status(400).send({
			error      : 'Request must contain an email',
			details    : { request : request.body },
			error_type : 'bad request'
		});
	}

	var mc_list_id = 'LIST_ID';
	var email = request.body.email;
	var age = request.body.age;
	var request_json;
	if (age) {
		request_json = {
			id         : mc_list_id,
			email      : { email : request.body.email },
			merge_vars : { age : age }
		};
	} else {
		request_json = {
			id         : mc_list_id,
			email      : { email : request.body.email }
		};
	}

	mc.lists.subscribe(request_json, function(data) {
		response.status(201).send({ email : data.email });
	},
	function(error) {
		response.status(502).send({
			error      : 'Request to MailChimp failed',
			details    : error.error,
			error_type : 'mailchimp'
		});
	});
}

function subscribe_new_user(username, email, callback) {
	if (!username || !email) {
		return callback('Mailchimp requires username and email');
	}

	var mc_list_id = 'LIST_ID';
	var request_json = {
		id         : mc_list_id,
		email      : { email : email },
		merge_vars : { username : username }
	};

	mc.lists.subscribe(request_json, function(data) {
		callback();
	},
	function(error) {
		return callback('Request to MailChimp failed: ' + error.error);
	});
}

exports.subscribe = subscribe;
exports.subscribe_new_user = subscribe_new_user;
