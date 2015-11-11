var mailer = require('mailer');

var mandrill_username = 'USERNAME';
var mandrill_password = 'PASSWORD';

function send_sexpert_chat_notification(email) {

	mailer.send({
		host           : 'smtp.mandrillapp.com',
		port           : 587,
		to             : email,
		from           : 'chat@dohookup.com',
		subject        : 'New Message from Dohookup',
//		body           : '',
		authentication : 'login',
		username       : mandrill_username,
		password       : mandrill_password,
		headers        : {
			'X-MC-Template'  : 'hookup-question'
		}
	},
	function(err, result) {
		if (err) {
			console.log('error: ' + err);
		} else {
			console.log('sexpert chat notification sent to ' + email);
		}
	});

}

function send_user_chat_notification(email, chat_id) {

	mailer.send({
		host           : 'smtp.mandrillapp.com',
		port           : 587,
		to             : email,
		from           : 'chat@dohookup.com',
		subject        : 'New Message from Dohookup',
//		body           : '',
		authentication : 'login',
		username       : mandrill_username,
		password       : mandrill_password,
		headers        : {
			'X-MC-Template'  : 'sexpert-answer',
			'X-MC-MergeVars' : { 'chat_url' : 'http://dohookup.com/launch/chat?id=' + chat_id, 'test' : 'test' }
		}
	},
	function(err, result) {
		if (err) {
			console.log('error: ' + err);
		} else {
			console.log('user chat notification sent to ' + email);
		}
	});

}

exports.send_sexpert_chat_notification = send_sexpert_chat_notification;
exports.send_user_chat_notification = send_user_chat_notification;
