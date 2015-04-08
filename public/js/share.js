$(document).ready(function() {
	var user_id = $('#this_user_id').val();

	$('#story-input').focus(function() {
		$(this).css('height', '');
		$(this).prop('rows', '4');
	});

	$('#share-button').click(function() {
		$storyInput = $('#story-input');
		$('#share-alert').html('');
		$.ajax({
			type        : 'POST',
			url         : '/stories/create',
			data        : JSON.stringify({
				content : $storyInput.val().trim()
			}),
			contentType : "application/json",
			success     : function(data) {
				$('#share-alert').html("Thanks for submitting! Other people will find this helpful. You're beautiful.");
				$storyInput.css('height', '');
				$storyInput.prop('rows', '1');
				$storyInput.val('');
			},
			error       : function() {
				$('#alert').html("Sorry, we had trouble submitting your amazing story.");
			}  
		});				
	});
});