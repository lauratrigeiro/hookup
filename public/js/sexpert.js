$(document).ready(function() {
	var sexpert_name = $('#username').text();
	var sexpert_id = $('#this_user_id').val();

	refreshWaiting();

	var socket = io();
	socket.emit('new sexpert');

	$('.online-status').click(function() {
		var active = (this.id === 'online');
		var $this = $(this);
		$.ajax({
			type        : 'PUT',
			url         : '/sexperts/active',
			data        : JSON.stringify({
				active : active
			}),
			contentType : 'application/json',
			success     : function() {
				$('.online-status.hidden-btn').removeClass('hidden-btn');
				$this.addClass('hidden-btn');
			}
		});
	});

	$('#waiting').on('click', '.connect', function(e) {
		e.preventDefault();
		$('#alert').empty();

		if ($('.online-status.hidden-btn').attr('id') === 'offline') {
			$('#alert').text('Please change your status to ONLINE before starting a chat');
			return;
		}

		var chat_id = $(this).data('chat_id');
		var username = $(this).text();
		var $waitingItem = $(this).closest('.waiting-item');
		var age = $waitingItem.find('.age').text();

		$.ajax({
			type        : 'GET',
			url         : '/chats/' + chat_id,
			contentType : 'application/json',
			success     : function(result) {
				var append_string = '\
				<div class="messages-container active">                        \
					<h4>Chat with ' + username + ', age ' + age + '</h4> \
					<ul class="messages">';
				result.messages.forEach(function(message) {
					var sender;
					if (message.sender === 'User') {
						sender = {
							li_class : 'user',
							username : username
						};
					} else {
						sender = {
							li_class : 'sexpert',
							username : sexpert_name
						};
					}

					append_string += '<li>' + showReturns(message.content) + '</li>    \
						<li class="' + sender.li_class + '-message">Sent by ' + sender.username + ' at ' + getCurrentTime(new Date(message.created_ts)) + '</li>';
				});

				append_string += '\
					</ul>\
					<form class="message-form" action = "" data-chat="' + chat_id + '" data-user="' + username + '"> \
						<textarea class="message" autocomplete="off" maxlength="600"></textarea>     \
						<button class="btn send-chat">Send</button>      \
						<button type="button" class="btn end-chat">End Chat</button>   \
					</form>                                              \
				</div>';

				$('#chat-windows').append(append_string);

				//connect to socket
				socket.emit('sexpert join', { chat_id : chat_id, sexpert_id : sexpert_id });
			},
			error       : function() {
				$('#alert').html('Sorry, an error occurred.');
			}
		});
	});

	$('#refresh-waiting').click(function() {
		refreshWaiting();
	});

	$('#chats-toggle').click(function() {
		if ($('.messages-container.ended:hidden').length > 0) {
			$('.messages-container.ended').css('display', 'inline-block');
		} else {
			$('.messages-container.ended').hide();
		}
	});

	$('#chat-windows').on('submit', '.message-form', function(e) {
		e.preventDefault();
		if ($('#alert').text() !== 'There are currently no users waiting to hookup.') {
			$('#alert').empty();
		}
		if ($('.online-status.hidden-btn').attr('id') === 'offline') {
			$('#alert').text('Please change your status to ONLINE before sending a message');
			return;
		}

		var $message = $(this).find('textarea');
	//	alert('chat_id: ' + $(this).data('chat') + ', message: ' + $message.val());
		socket.emit('sexpert message', {
			chat_id : $(this).data('chat'),
			message : $message.val()
		});

		$(this).prev('.messages').append('<li>' + showReturns($message.val()) + '</li>    \
			<li class="sexpert-message">Sent by ' + sexpert_name + ' at ' + getCurrentTime(new Date()) + '</li>');
		$message.val('');
		$(this).closest('.messages-container').removeClass('active');
	});

	// $("#message").keyup(function(e) {
 //        if(e.keyCode == 13) {
 //            $('#message-form').submit();
 //        }
 //    });

	$('#chat-windows').on('click', '.end-chat', function() {
		socket.emit('sexpert end chat', $(this).closest('.message-form').data('chat'));
		var $messages_container = $(this).closest('.messages-container');
		$messages_container.removeClass('active');
		$messages_container.addClass('ended');
		$messages_container.find('.send-chat').prop('disabled', true);
		$messages_container.find('.message').prop('disabled', true);
		$(this).prop('disabled', true);
		$messages_container.hide();
		refreshWaiting();
	});

	socket.on('update waiting', function() {
		console.log('refresh waiting');
		refreshWaiting();
	});

	socket.on('new message', function(data) {
		var $chat_form = $('#chat-windows form[data-chat="' + data.chat_id + '"]');
		$chat_form.prev('.messages').append('<li>' + showReturns(data.message) + '</li>    \
			<li class="user-message">Sent by ' + $chat_form.data('user') + ' at ' + getCurrentTime(new Date()) + '</li>');
		$chat_form.closest('.messages-container').addClass('active');

	});

	socket.on('closed chat', function(data) {
		var $chat_form = $('#chat-windows form[data-chat="' + data + '"]');
		$chat_form.prev('.messages').append('<li>The previous message did not send. This chat has already been closed.</li>    \
			<li class="user-message">Sent by ' + $chat_form.data('user') + ' at ' + getCurrentTime(new Date()) + '</li>');
		var $messages_container = $chat_form.closest('.messages-container');
		$messages_container.removeClass('active');
		$messages_container.addClass('ended');
		$chat_form.find('.send-chat').prop('disabled', true);
		$chat_form.find('.end-chat').prop('disabled', true);
		$messages_container.find('.message').prop('disabled', true);
		refreshWaiting();
	});

	socket.on('user end chat', function(data) {
		var $chat_form = $('#chat-windows form[data-chat="' + data + '"]');
		$chat_form.prev('.messages').append('<li>User ended the chat.</li>    \
			<li class="user-message">Sent by ' + $chat_form.data('user') + ' at ' + getCurrentTime(new Date()) + '</li>');
		var $messages_container = $chat_form.closest('.messages-container');
		$messages_container.removeClass('active');
		$messages_container.addClass('ended');
		$chat_form.find('.send-chat').prop('disabled', true);
		$chat_form.find('.end-chat').prop('disabled', true);
		$messages_container.find('.message').prop('disabled', true);
		refreshWaiting();
	});

	socket.on('user connected', function(data) {
		var $chat_form = $('#chat-windows form[data-chat="' + data + '"]');
		$chat_form.prev('.messages').append('<li>User is connected.</li>    \
			<li class="user-message">Sent by ' + $chat_form.data('user') + ' at ' + getCurrentTime(new Date()) + '</li>');
	});

	socket.on('user disconnected', function(data) {
		var $chat_form = $('#chat-windows form[data-chat="' + data + '"]');
		$chat_form.prev('.messages').append('<li>User was disconnected.</li>    \
			<li class="user-message">Sent by ' + $chat_form.data('user') + ' at ' + getCurrentTime(new Date()) + '</li>');
	});

	socket.on('error', function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log('socket sexpert error');
		}
	});
});

function refreshWaiting() {
	$('#waiting').html('');
	$.ajax({
		type        : 'GET',
		url         : '/chats/open',
		contentType : 'application/json',
		success     : function(data) {
			var appendString = '';
			if (data) {
				data.forEach(function(row) {
					var awaiting_response = (row.sender === 0) ? '*** awaiting your response' : '';
					appendString += '<li class="waiting-item"><a href="#" class="connect" data-chat_id="'
						+ row.chat_id + '" data-user_id="' + row.user_id + '">' + row.username
						+ '</a>, <span class="age"> age: ' + (row.age || '?') + ', </span><span class="created-ts">sent: '
						+ getCurrentTime(new Date(row.created_ts), true) + ': </span><span class="content">' + row.content + '</span>\
						<span class="awaiting-response">' + awaiting_response + '</span></li>';
				});
			}

			if (!appendString) {
				$('#alert').html('There are currently no users waiting to hookup.');
			} else {
				$('#waiting').append(appendString);
			}
		},
		error       : function() {
			$('#alert').html('Sorry, an error occurred.');
		}
	});
}

function getCurrentTime(date, include_day) {
	if (include_day) {
		var month = date.getMonth() + 1;
		if (month < 10) {
			month = '0' + month;
		}

		var day = date.getDate();
		if (day < 10) {
			day = '0' + day;
		}
	}

	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	var strTime;
	if (include_day) {
		strTime = month + '-' + day + ' ' + hours + ':' + minutes + ' ' + ampm;
	} else {
		strTime = hours + ':' + minutes + ' ' + ampm;
	}

	return strTime;
}

function showReturns(str) {
	return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}
