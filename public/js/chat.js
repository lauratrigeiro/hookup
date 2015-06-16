var chat_id, sexpert_name, sexpert_src;
var socket = io();

$(document).ready(function() {
	var username = $('#username').text();
	var user_src = '/public/images/pinkbunny_small.png'; // for now
	var split_query = window.location.search.split('=');
	if (split_query[0] !== '?id') {
		$('#alert').html('Sorry, this chat is invalid.');
	} else {
		chat_id = split_query[1];
		$.ajax({
			type        : 'GET',
			url         : '/chats/' + chat_id,
			success     : function(result) {
				if (result.closed_ts) {
					$('#alert').html('This chat has been closed.');
					$('input').prop('disabled', true);
					$('.question').hide();
					socket.disconnect();
					return;
				}

				sexpert_name = result.sexpert_username;
				//temporary
				var sexpert_names = ['jake', 'kaitlin', 'tara s', 'sarah', 'brie', 'steffani' /*', tory'*/];
				if (sexpert_names.indexOf(sexpert_name.toLowerCase()) < 0) {
					sexpert_src = '/public/images/sexperts/kristy_profile';
				} else {
					sexpert_src = '/public/images/sexperts/' + sexpert_name.toLowerCase();
				}

				displaySexpert(result.sexpert_id);

				result.messages.forEach(function(message) {
					var sender;
					if (message.sender === 'User') {
						sender = {
							li_class : 'user',
							username : username,
							img_src  : user_src
						};
					} else {
						sender = {
							li_class : 'sexpert',
							username : sexpert_name,
							img_src  : sexpert_src + '-small.png'
						};
					}

					$('.conversation').append('<li class="' + sender.li_class + '"><p>' + showReturns(message.content) + '</p>\
						<p class="byline"><span class="author">' + sender.username + '</span> \
						asked at ' + getCurrentTime(new Date(message.created_ts)) + '</p>\
						<p class="avatar"><img src="' + sender.img_src + '"/></p></li>');
				});

				// connect to socket
				socket.emit('user join', chat_id);
			},
			error       : function() {
				$('#alert').html('Sorry, an error occurred.');
			}
		});
	}

	// var socket = io();
	// socket.emit('user join', chat_id);

	$('#submit').click(function(e) {
		e.preventDefault();
		var message_to_send = $('#description').val();
		socket.emit('user message', message_to_send);
		$('.conversation').append('<li class="user"><p>' + showReturns(message_to_send) + '</p>\
			<p class="byline"><span class="author">' + username + '</span> \
			asked at ' + getCurrentTime(new Date()) + '</p>\
			<p class="avatar"><img src="' + user_src + '"/></p></li>');
		$('#description').val('');
	});

	$('#end-chat').click(function() {
//		socket.disconnect();
		socket.emit('user end chat');
		$('.conversation').append('<li class="sexpert"><p>You ended this chat. Thanks for hooking up!</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			answered at ' + getCurrentTime(new Date()) + '</p>\
			<p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>');
		$('#description').prop('disabled', true);
		$('#submit').prop('disabled', true);
		$('#end-chat').prop('disabled', true);
	});

	// $("#message").keyup(function(e) {
 //        if(e.keyCode == 13) {
 //            $('#message-form').submit();
 //        }
 //    });

	socket.on('connected to sexpert', function(data) {
		$('.conversation').append('<li class="sexpert"><p>Sexpert is connected to chat.</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			answered at ' + getCurrentTime(new Date()) + '</p>\
			<p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>');
	});
	// 	$.ajax({
	// 		type        : 'GET',
	// 		url         : '/chats/sexpert?id=' + data,
	// 		success     : function(result) {
	// 			$('#alert').html('');
	// 			$('#sexpert-content').show();
	// 			sexpert_name = result.username;
	// 			sexpert_src = '/public/images/sexperts/' + sexpert_name.toLowerCase();
	// 			//temporary
	// 			var sexpert_names = ['jake', 'kaitlin', 'tory'];
	// 			if (sexpert_names.indexOf(sexpert_name.toLowerCase()) < 0) {
	// 				sexpert_src = '/public/images/sexperts/kristy_profile';
	// 			}
	// 			$('#pic').attr('src', sexpert_src + '.png');
	// 			$('#name').html(sexpert_name);
	// 			$('#experience').html(result.experience);
	// 			$('#bio').html(result.bio);
	// 		}
	// 	});
	// });

	socket.on('new message', function(data) {
		$('.conversation').append('<li class="sexpert"><p>' + showReturns(data) + '</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			answered at ' + getCurrentTime(new Date()) + '</p>\
			<p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>'); //
	});

	socket.on('sexpert end chat', function() {
		$('.conversation').append('<li class="sexpert"><p>Sexpert has left this chat. You may close this window when you are ready.</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			answered at ' + getCurrentTime(new Date()) + '</p>\
			<p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>');
		$('#description').prop('disabled', true);
		$('#submit').prop('disabled', true);
		$('#end-chat').prop('disabled', true);
		socket.disconnect();
	});

	socket.on('chat closed', function() {
		$('.conversation').append('<li class="sexpert"><p>The previous message did not send. This chat has already been closed.</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			answered at ' + getCurrentTime(new Date()) + '</p>\
			<p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>');
		$('#description').prop('disabled', true);
		$('#description').attr('placeholder', '');
		$('#submit').prop('disabled', true);
		$('#end-chat').prop('disabled', true);
		socket.disconnect();
	});

	socket.on('sexpert disconnected', function() {
		$('.conversation').append('<li class="sexpert"><p>Sexpert was disconnected.</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			answered at ' + getCurrentTime(new Date()) + '</p>\
			<p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>');
	});

	socket.on('error', function(err) {
		if (err) {
			console.log(err);
		} else {
			console.log('socket user error');
		}
	});
});

function getCurrentTime(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0' + minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

function showReturns(str) {
	return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}

function displaySexpert(sexpert_id) {
	$.ajax({
		type        : 'GET',
		url         : '/chats/sexpert?id=' + sexpert_id,
		success     : function(result) {
			$('#alert').html('');
			$('#sexpert-content').show();

			$('#pic').attr('src', sexpert_src + '.png');
			$('#name').html(sexpert_name);
			$('#experience').html(result.experience);
			$('#bio').html(result.bio);
		}
	});
}
