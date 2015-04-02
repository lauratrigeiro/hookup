$(document).ready(function() {
	var sexpert_name = $('#username').text();

	$.ajax({
		type        : 'GET',
		url         : '/chats/waiting',
		contentType : "application/json",
		success     : function(data) {
			var appendString = '';
			data.forEach(function(row) {
				appendString += '<li class="waiting-item"><a href="#" class="connect" data-chat-id="'
					+ row.chat_id + '" data-user-id="' + row.user_id + '">' + row.username
					+ '</a><span class="age">' + (row.age || '?') + '</span><span class="created-ts">'
					+ row.created_ts + '</span><span class="content">' + row.content + '</span></li>';
			});

			$('#waiting').append(appendString);
		},
		error       : function() {
			$('#alert').html("Sorry, an error occurred.");
		}  
	});

	$('#waiting').on('click', '.connect', function(e) {
		e.preventDefault();
		var chat_id = $(this).data('chat-id');
		var user_id = $(this).data('user-id');
		var username = $(this).text();
		var $waitingItem = $(this).closest('.waiting-item');
		var age = $waitingItem.find('.age').text();
		var created_ts = $waitingItem.find('.created-ts').text();
		var content = $waitingItem.find('.content').text();

		$.ajax({
			type        : 'POST',
			url         : '/chats/connect',
			data        : JSON.stringify({
				chat_id : chat_id
			}),
			contentType : "application/json",
			success     : function(data) {
				$('#alert').html("Please wait to hookup...");
				//open chat
				$('#chat-windows').append(
					'<div class="messages-container">                        \
						<h4>Chat with ' + username + ', age ' + age + '</h4> \
						<ul class="messages">                                \
							<li class="user-message">' + content + '</li>    \
							<li class="sent-message">Sent by ' + username + ' at ' + created_ts + '</li> \
						</ul>                                                \
						<form class="message-form" action = "" data-chat="' + chat_id + '">              \
							<input class="message" autocomplete="off" />     \
							<button class="btn">Send</button>                \
						</form>                                              \
					</div>');

				//connect so socket
			},
			error       : function() {
				$('#alert').html("Sorry, an error occurred.");
			}  
		});
	});

	var socket = io();

	$('#chat-windows').on('submit', '.message-form', function (e) {
		e.preventDefault();
		send_message();
	});

	// $("#message").keyup(function(e) {
 //        if(e.keyCode == 13) {
 //            $('#message-form').submit();
 //        }
 //    });

	socket.on('new message', function(data) {
		var message_class = 'user-message';
		// if (data.username == username) {
		// 	message_class = 'my-message';
		// } else {
		// 	message_class = 'other-message';
		// }

		$('#chat-windows .messages').append($('<li class="' + message_class + '">').text(data.message));
	});

	function send_message() {
		socket.emit('send message', //{
		//	username : username,
		/*	message :*/ $('#chat-windows .message').val()
		/*}*/ );

		$('#chat-windows .message').val('');
	}
});