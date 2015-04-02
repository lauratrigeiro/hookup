$(document).ready(function() {
	var username = $('#username').val();
	if (window.location.pathname === '/tn/chat') {
		var chat_id;
		var split_query = window.location.search.split('=');
		if (split_query[0] !== '?id') {
			$('#alert').html("Sorry, this chat id is invalid.");
		} else {
			chat_id = split_query[1];
			$.ajax({
				type        : 'GET',
				url         : '/chats/first?id=' + chat_id,
				contentType : "application/json",
				success     : function(result) {
					$('#messages').append($('<li class="user-message">').text(result.content));
					$('#messages').append($('<li class="sent-message">').text('Sent by ' + username + ' at ' + result.created_ts));
					// connect to socket
				},
				error       : function() {
					$('#alert').html("Sorry, an error occurred.");
				}
			});
		}
	}

});