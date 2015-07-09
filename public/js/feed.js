$(document).ready(function() {
	var user_id = $('#this_user_id').val();
	loadChats(0);

	$('#chat-feed').on('click', '.approve', function() {
		var $chat = $(this).parents('.chat');
		$.post('/chats/approve', {chat_id: $chat.data('chat_id')}, function(data) {
			$chat.remove();
		});
	});

	$('#chat-feed').on('click', '.deny', function() {
		var $chat = $(this).parents('.chat');
		$.post('/chats/deny', {chat_id: $chat.data('chat_id')}, function(data) {
			$chat.remove();
		});
	});

	$('#chat-feed').on('click', '.display-username', function() {
		var $chat = $(this).parents('.chat');
		var $input = $chat.find('#display-username-input');

		$.ajax({
			type        : 'PUT',
			url         : '/chats/display_username',
			contentType : 'application/json',
			data        : JSON.stringify({
				chat_id          : $chat.data('chat_id'),
				display_username : $input.val()
			}),
			success     : function(result) {
				console.log(result);
			}
		});
	});

	$('#chat-feed').on('click', '.remove-message', function() {
		var $this = $(this);
		var $message = $this.closest('.message-container');
		var message_id = $message.data('message_id');
		var status = ($this.text().trim() === 'Remove') ? 2 : 1;

		$.ajax({
			type        : 'PUT',
			url         : '/messages/' + message_id,
			contentType : 'application/json',
			data        : JSON.stringify({
				status : status
			}),
			success     : function(result) {
				$this.text((status === 2) ? 'Add' : 'Remove');
				$message.find('.message-content').toggleClass('removed');
			}
		});
	});

	$('#chat-feed').on('click', '.edit-message', function() {
		var $message = $(this).closest('.message-container');
		$message.find('.message-content').hide();
		$message.find('.edit-message-buttons').hide();
		$message.find('.edit-area').show();
	});

	$('#chat-feed').on('click', '.cancel-button', function() {
		var $message = $(this).closest('.message-container');
		$message.find('.message-edit').val($message.data('content'));
		$message.find('.edit-area').hide();
		$message.find('.message-content').show();
		$message.find('.edit-message-buttons').show();
	});

	$('#chat-feed').on('click', '.save-button', function() {
		var $message = $(this).closest('.message-container');
		var new_content = $message.find('textarea').val().trim();

		$.ajax({
			type        : 'PUT',
			url         : '/messages/' + $message.data('message_id'),
			contentType : 'application/json',
			data        : JSON.stringify({
				content : new_content
			}),
			success     : function(result) {
				$message.data('content', new_content);
				$message.find('.edit-area').hide();
				$message.find('.message-content').html(showReturns(new_content)).show();
				$message.find('.edit-message-buttons').show();
			}
		});
	});
});

function loadChats(offset) {
	var status = $('#chat-feed').data('status');
	$.get('/chats-' + status + '?offset=' + offset, function(data) {
		for (var i = 0, len = data.length; i < len; i++) {
			$.get('/chats/' + data[i].chat_id, function(chat_data) {
				var chat_node = new EJS({url: '/public/ejs/chat.ejs'}).render({data: chat_data, status: status});
				$('#chat-feed').append(chat_node);
			});
		}
	});
}

function showReturns(str) {
	return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}
