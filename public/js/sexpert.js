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
					+ '</a><span class="age">' + row.age + '</span><span class="created-ts">'
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
		var created_ts = $waitingItem.find('.created-ts');
		var content = $waitingItem.find('.content');

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
				//connect so socket
			},
			error       : function() {
				$('#alert').html("Sorry, an error occurred.");
			}  
		});
	});
});