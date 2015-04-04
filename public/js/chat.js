$(document).ready(function() {
	var username = $('#username').text();
	var chat_id;
	var split_query = window.location.search.split('=');
	if (split_query[0] !== '?id') {
		$('#alert').html("Sorry, this chat id is invalid.");
	} else {
		chat_id = split_query[1];
		$.ajax({
			type        : 'GET',
			url         : '/chats/first?id=' + chat_id,
	//		contentType : "application/json",
			success     : function(result) {
				$('.messages').append($('<li class="user-message">').text(result.content));
				$('.messages').append($('<li class="sent-message">').text('Sent by ' + username + ' at ' + result.created_ts));
				// connect to socket
			},
			error       : function() {
				$('#alert').html("Sorry, an error occurred.");
			}
		});
	}

	var socket = io();
	socket.emit('user join', chat_id);

	$('.message-form').submit(function (e) {
		e.preventDefault();
		send_message();
	});

	// $("#message").keyup(function(e) {
 //        if(e.keyCode == 13) {
 //            $('#message-form').submit();
 //        }
 //    });

	socket.on('connected to sexpert', function(data) {
		$('#alert').html('');
		$('#sexpert-profile').append('<p>Sexpert id: ' + data + '</p>');
	});

	socket.on('new message', function(data) {
		var message_class = 'sexpert-message';
		// if (data.username == username) {
		// 	message_class = 'my-message';
		// } else {
		// 	message_class = 'other-message';
		// }

		$('.messages').append($('<li class="' + message_class + '">').text(data));
	});

	function send_message() {
		var message_to_send = $('.message').val();
		socket.emit('user message', message_to_send);
		$('.messages').append($('<li class="user-message">').text(message_to_send));
		$('.message').val('');
	}

	socket.on('sexpert disconnected', function() {
		alert('sexpert disconnected!');
	});
});