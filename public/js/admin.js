$(document).ready(function() {
	$('#check-credentials').click(function(e) {
		e.preventDefault();
		var username = $('#username').val();
		$.ajax({
			type        : 'GET',
			url         : '/admin/users?name=' + username,
			contentType : "application/json",
			success     : function(result) {
				$('#message').html(JSON.parse(result));
			},
			error       : function() {
				$('#message').html("Sorry, an error occurred.");
			}
		});
	})

	$('#submit-type').click(function(e) {
		e.preventDefault();
		var username = $('#username').val();
		var user_type = $('#user-type').val();
		$.ajax({
			type        : 'POST',
			url         : '/admin/users',
			contentType : "application/json",
			data        : {
				username  : username,
				user_type : user_type
			},
			success     : function(result) {
				$('#message').html("User successfully upgraded.");
			},
			error       : function() {
				$('#message').html("Sorry, an error occurred.");
			}
		});
	})
});