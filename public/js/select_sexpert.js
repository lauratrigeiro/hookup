$(document).ready(function() {
	display_sexperts();

	$('#sexpert-list').on('click', '.select-sexpert-btn', function() {
		// TODO: add sexpert_id to chat --> adapt chats.connect
		var split_query = window.location.search.split('=');
		if (split_query[0] !== '?id') {
			$('#alert').html('Sorry, this chat is invalid.');
			return;
		}

		var chat_id = split_query[1];
		var sexpert_id = $(this).data('sexpert_id');

		$.ajax({
      type        : 'POST',
      url         : '/chats/select_sexpert',
      contentType : 'application/json',
      data        : JSON.stringify({
				chat_id    : chat_id,
				sexpert_id : sexpert_id
      }),
      success     : function(result) {
				window.location.href($('#route').val() + '/chat?id=' + result.chat_id, 'blank');
			},
      error       : function() {
				$('#message').html('Sorry, an error occurred.');
			},
      async: false
    });
	});
});

function display_sexperts() {
	$.ajax({
		type        : 'GET',
		url         : '/sexperts',
		success     : function(data) {
			data.forEach(function(sexpert) {
				var sexpert_name = sexpert.username;
				var sexpert_src = '/public/images/sexperts/' + sexpert_name.toLowerCase();
				//temporary
				var sexpert_names = ['jake', 'kaitlin', 'tory'];
				if (sexpert_names.indexOf(sexpert_name.toLowerCase()) < 0) {
					sexpert_src = '/public/images/sexperts/kristy_profile';
				}

				$('#sexpert-list').append('<li class="sexpert-list-item">\
					<span class="photo"><img src="' + sexpert_src + '.png" /></span>\
					<span class="username">' + sexpert_name + '</span>\
					<div class="second-row">\
						<span class="age">' + sexpert.age + ' years old</span>\
						<span class=gender">' + sexpert.gender + '</span>\
					</div>\
					<button class="select-sexpert-btn btn" data-sexpert_id="' + sexpert.sexpert_id + '">Select</button>\
				</li>');
			});
		}
	});
}
