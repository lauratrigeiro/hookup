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
		var chat_id = $(this).data('chat_id');
		var user_id = $(this).data('user_id');
		var username = $(this).text();
		var $waitingItem = $(this).closest('.waiting-item');
		var age = $waitingItem.find('.age').text();
		var created_ts = $waitingItem.find('.created-ts').text();
		var content = $waitingItem.find('.content').text();

		socket.emit('sexpert join', { chat_id : chat_id, sexpert_id : sexpert_id });
		socket.on('user status', function(data) {
			if (!data) {
				$('#alert').html("Please wait this user is not connected yet.");
			} else {
				$.ajax({
					type        : 'POST',
					url         : '/chats/connect',
					data        : JSON.stringify({
						chat_id : chat_id
					}),
					contentType : "application/json",
					success     : function(data) {
				//		$('#alert').html("Please wait to hookup...");
						//open chat
						$('#chat-windows').append(
							'<div class="messages-container active">                        \
								<h4>Chat with ' + username + ', age ' + age + '</h4> \
								<ul class="messages">                                \
									<li>' + showReturns(content) + '</li>    \
									<li class="user-message">Sent by ' + username + ' at ' + created_ts + '</li> \
								</ul>                                                \
								<form class="message-form" action = "" data-chat="' + chat_id + '" data-user="' + username + '"> \
									<textarea class="message" autocomplete="off" maxlength="600"></textarea>     \
									<button class="btn send-chat">Send</button>      \
									<button type="button" class="btn end-chat">End Chat</button>   \
								</form>                                              \
							</div>');

						//connect to socket
						
					},
					error       : function() {
						$('#alert').html("Sorry, an error occurred.");
					}  
				});				
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

	$('#chat-windows').on('submit', '.message-form', function (e) {
		e.preventDefault();
		$message = $(this).find('textarea');
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
		refreshWaiting();
	});

	socket.on('new message', function(data) {
		var message_class = 'user-message';
		var $chat_form = $('#chat-windows form[data-chat="' + data.chat_id + '"]');
		$chat_form.prev('.messages').append('<li>' + showReturns(data.message) + '</li>    \
			<li class="user-message">Sent by ' + $chat_form.data('user') + ' at ' + getCurrentTime(new Date()) + '</li>');
		$chat_form.closest('.messages-container').addClass('active');

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
		url         : '/chats/waiting',
		contentType : "application/json",
		success     : function(data) {
			var appendString = '';
			data.forEach(function(row) {
				appendString += '<li class="waiting-item"><a href="#" class="connect" data-chat_id="'
					+ row.chat_id + '" data-user_id="' + row.user_id + '">' + row.username
					+ '</a>, <span class="age"> age: ' + (row.age || '?') + ', </span><span class="created-ts">sent: '
					+ getCurrentTime(new Date(row.created_ts)) + ': </span><span class="content">' + row.content + '</span></li>';
			});

			if (!appendString) {
				$('#alert').html("There are currently no users waiting to hookup.");
			} else {
				$('#waiting').append(appendString);
			}
		},
		error       : function() {
			$('#alert').html("Sorry, an error occurred.");
		}  
	});
}

function getCurrentTime(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

function showReturns(str) {
	return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}