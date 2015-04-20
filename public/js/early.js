$(document).ready(function() {
	$('#mailchimp-form').submit(function(e) {
		e.preventDefault();
		$('#alert-message').addClass('error');
		$('#alert-message').removeClass('success');
		$('#alert-message').html('');

		var email = $('#email').val().trim();
		if (!email) {
			$('#alert-message').html("You must provide an email address.");
			return;
		} else if (email.indexOf('@') < 0) {
			$('#alert-message').html("Email address must contain '@'.");
			return;
		}

		var age = $('#age').val().trim();
		if (!(parseInt(age) > 0)) {
			$('#alert-message').html('Age must be a number between 1 and 130.');
			return;
		}

		var data = JSON.stringify({
			"email" : email,
			"age"   : age
		});

		$.ajax({
			url: '/mailchimp/subscribe',
			data: data,
			type: 'POST',
			contentType: 'application/json',
			error: function(err) {
				$('#alert-message').html("Processing error - please try again.");
			},
			success: function(data) {
				$('#alert-message').removeClass('error');
				$('#alert-message').addClass('success');
				$('#alert-message').html(data.email + " is now subscribed! Please check your email to confirm.");
			}
		});
	})
});