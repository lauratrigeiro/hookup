$(document).ready(function() {
	var pathArray = window.location.pathname.split('/');
	var chat_id = pathArray[pathArray.length - 1];
	$.ajax({
		type        : 'GET',
		url         : '/chats/' + chat_id,
		contentType : 'application/json',
		success     : function(result) {
			$('#user_age').html(result.user_age || '');
			$('#sexpert').html(result.sexpert_username);
			$('#closed_ts').html(new Date(result.closed_ts * 1000) || '');
			$('#messages tbody').empty();

			result.messages.forEach(function(row) {
				$('#messages tbody').append('\
					<tr>\
						<td>' + row.sender + '</td>\
						<td>' + row.content + '</td>\
						<td>' + new Date(row.created_ts * 1000) + '</td>\
					</tr>');
			});
		}
	});
});
