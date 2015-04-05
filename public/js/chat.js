$(document).ready(function() {
	var username = $('#username').text();
	var chat_id, sexpert_name, sexpert_src;
	var user_src = '/public/images/pinkbunny_small.png'; // for now
	var split_query = window.location.search.split('=');
	if (split_query[0] !== '?id') {
		$('#alert').html("Sorry, this chat is invalid.");
	} else {
		chat_id = split_query[1];
		$.ajax({
			type        : 'GET',
			url         : '/chats/first?id=' + chat_id,
	//		contentType : "application/json",
			success     : function(result) {
				$('.conversation').append('<li class="user"><p>' + showReturns(result.content) + '</p>\
					<p class="byline"><span class="author">' + username + '</span> \
					 asked at ' + getCurrentTime(new Date(result.created_ts)) + '</p>\
					 <p class="avatar"><img src="' + user_src + '"/></p></li>');

				// connect to socket
			},
			error       : function() {
				$('#alert').html("Sorry, an error occurred.");
			}
		});
	}

	var socket = io();
	socket.emit('user join', chat_id);

	$('#submit').click(function (e) {
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
		socket.emit('user end chat');
		$('.conversation').append('<li class="sexpert"><p>You ended this chat. Thanks for hooking up!</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			 answered at ' + getCurrentTime(new Date()) + '</p>\
			 <p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>');
		$('#description').prop('disabled', true);
		$('#submit').prop('disabled', true);
		$('#end-chat').prop('disabled', true);
		socket.disconnect();
	});

	// $("#message").keyup(function(e) {
 //        if(e.keyCode == 13) {
 //            $('#message-form').submit();
 //        }
 //    });

	socket.on('connected to sexpert', function(data) {
		$.ajax({
			type        : 'GET',
			url         : '/chats/sexpert?id=' + data,
			success     : function(result) {
				$('#alert').html('');
				$('#sexpert-content').show();
				sexpert_name = result.username;
				sexpert_src = '/public/images/sexperts/' + sexpert_name.toLowerCase();
				//temporary
				var sexpert_names = ['jake', 'kaitlin', 'tory']
				if (sexpert_names.indexOf(sexpert_name.toLowerCase()) < 0) {
					sexpert_src = '/public/images/sexperts/kristy_profile';
				}
				$('#pic').attr('src', sexpert_src + '.png');
				$('#name').html(sexpert_name);
				$('#experience').html(result.experience);
				$('#bio').html(result.bio);
			}
		});
	});

	socket.on('new message', function(data) {
		$('.conversation').append('<li class="sexpert"><p>' + showReturns(data) + '</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			 answered at ' + getCurrentTime(new Date()) + '</p>\
			 <p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>'); //
	});

	socket.on('sexpert end chat', function() {
		$('.conversation').append('<li class="sexpert"><p>Sexpert has left this chat.</p>\
			<p class="byline"><span class="author">' + sexpert_name + '</span> \
			 answered at ' + getCurrentTime(new Date()) + '</p>\
			 <p class="avatar"><img src="' + sexpert_src + '-small.png" /></p></li>');
		$('#description').prop('disabled', true);
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
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

function showReturns(str) {
	return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}