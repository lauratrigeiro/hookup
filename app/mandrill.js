var mandrill = require('mandrill-api/mandrill');

var mandrill_client = new mandrill.Mandrill('PASSWORD');

var testing = false;
var site_chat_url;
if (testing) {
	site_chat_url = 'http://hookup-dev.elasticbeanstalk.com/launch/chat?id=';
} else {
	site_chat_url = 'http://www.dohookup.com/launch/chat?id=';
}

function send_sexpert_chat_notification(email) {
	var template_name = 'hookup-question';
	var message = {
		subject    : 'New Message from Hookup',
		from_email : 'chat@dohookup.com',
		from_name  : 'Hookup',
		to         : [{ email : email }]
	};

	mandrill_client.messages.sendTemplate({
		template_name    : template_name,
		template_content : [],
		message          : message,
		async            : false
	},
	function(result) {
		console.log(result);
	},
	function(e) {
		console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	});
}

function send_user_chat_notification(email, chat_id) {
	var template_name = 'sexpert-answer';
	var message = {
		subject           : 'New Message from Hookup',
		from_email        : 'chat@dohookup.com',
		from_name         : 'Hookup',
		to                : [{ email : email }],
		merge_language    : 'mailchimp',
		global_merge_vars : [{
			name    : 'chat_url',
			content : site_chat_url + chat_id
		}]
	};

	mandrill_client.messages.sendTemplate({
		template_name    : template_name,
		template_content : [],
		message          : message,
		async            : false
	},
	function(result) {
		console.log(result);
	},
	function(e) {
		console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
	});
}

exports.send_sexpert_chat_notification = send_sexpert_chat_notification;
exports.send_user_chat_notification = send_user_chat_notification;
