$(document).ready(function() {
	$('#check-credentials').click(function(e) {
		e.preventDefault();
		var username = $('#username').val();
		$.ajax({
			type        : 'GET',
			url         : '/admin/users?name=' + username,
			contentType : "application/json",
			success     : function(result) {
				var roles = [];
				if (result.sexpert) {
					roles.push('sexpert');
				}
				if (result.employee) {
					roles.push('employee');
				}
				if (result.admin) {
					roles.push('admin');
				}
				if (roles.length === 0) {
					roles.push('no roles');
				}
				$('#credentials').html(result.username + ': ' + roles.join(', '));
			},
			error       : function() {
				$('#credentials').html("Sorry, an error occurred.");
			}
		});
	});

	$('#submit-type').click(function(e) {
		e.preventDefault();
		var username = $('#username').val();
		var user_type = $('#user-type').val();
		$.ajax({
			type        : 'POST',
			url         : '/admin/users',
			contentType : "application/json",
			data        : JSON.stringify({
				username  : username,
				user_type : user_type
			}),
			success     : function(result) {
				$('#message').html("User successfully upgraded.");
			},
			error       : function() {
				$('#message').html("Sorry, an error occurred.");
			}
		});
	});

	$('#submit-profile').click(function(e) {
		e.preventDefault();
		var username = $('#username').val();
		var experience = $('#experience').val();
		var bio = $('#bio').val().trim();
		$.ajax({
			type        : 'POST',
			url         : '/admin/sexperts',
			contentType : "application/json",
			data        : JSON.stringify({
				username   : username,
				experience : experience,
				bio        : bio
			}),
			success     : function(result) {
				$('#message').html("Profile successfully added.");
			},
			error       : function() {
				$('#message').html("Sorry, an error occurred.");
			}
		});
	})
});