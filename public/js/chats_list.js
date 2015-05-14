$(document).ready(function() {
	$.ajax({
		type        : 'GET',
		url         : '/chats',
		contentType : 'application/json',
		success     : function(result) {
			$('#total').html(result.length);
			$('#chats tbody').empty();
			result.forEach(function(row) {
				$('#chats tbody').append('\
					<tr>\
						<td class="created_ts table-link" data-chat_id="' + row.chat_id + '">' + row.created_ts + ' - ' + new Date(row.created_ts * 1000) + '</td>\
						<td class="user_age">' + (row.user_age || '') + '</td>\
						<td class="sexpert">' + (row.sexpert_username || '') + '</td>\
						<td class="messages">' + row.messages + '</td>\
						<td class="closed_ts">' + (row.closed_ts ? row.closed_ts + ' - ' + new Date(row.closed_ts * 1000) : '') + '</td>\
					</tr>');
			});

			configure_list();
		}
	});

	$('tbody').on('click', '.created_ts', function() {
		window.location.href = 'chats/' + $(this).data('chat_id');
	});
});

function configure_list() {
	var pagination_top_options = {
		name            : 'paginationTop',
		paginationClass : 'pagination-top',
		innerWindow     : 1,
		outerWindow     : 1
	};

	var pagination_bottom_options = {
		name            : 'paginationBottom',
		paginationClass : 'pagination-bottom',
		innerWindow     : 1,
		outerWindow     : 1
	};

	var list_options = {
			valueNames : [ 'created_ts', 'user_age', 'sexpert', 'messages', 'closed_ts'],
			page       : 10,
			indexAsync : true,
			plugins    : [
				ListPagination(pagination_top_options),
				ListPagination(pagination_bottom_options)
			]
		};

	var chatsList = new List('chats', list_options);
//	chatsList.sort('created_ts', { order : 'desc' });
}
