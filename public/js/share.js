$(document).ready(function() {
	var user_id = $('#this_user_id').val();

	loadStories(0);

	$('#story-input').focus(function() {
		$(this).css('height', '');
		$(this).prop('rows', '4');
	});

	$('#share-button').click(function() {
		var $storyInput = $('#story-input');
		$('#share-alert').html('');
		$.ajax({
			type        : 'POST',
			url         : '/stories/create',
			data        : JSON.stringify({
				content : $storyInput.val().trim()
			}),
			contentType : 'application/json',
			success     : function(data) {
				$('#share-alert').html('Cool story, bro. It\'ll be up soon.');
				$storyInput.css('height', '');
				$storyInput.prop('rows', '1');
				$storyInput.val('');
			},
			error       : function() {
				$('#alert').html('Sorry, we had trouble submitting your amazing story.');
			}
		});
	});

	$('#load-more').click(function() {
		loadStories($(this).data('offset'));
	});

	$('#stories').on('click', '.upvote-image.enabled', function() {
		var $upvoteImage = $(this);
		$.ajax({
			type         : 'POST',
			url          : '/stories/upvote',
			data         : JSON.stringify({
				story_id : $upvoteImage.prev().data('story_id')
			}),
			contentType  : 'application/json',
			success      : function(data) {
				var prev_upvotes = parseInt($upvoteImage.prev().text());
				$upvoteImage.prev().html(prev_upvotes + 1);
				$upvoteImage.prop('src', '/public/images/condom_selected.png');
				$upvoteImage.css('cursor', 'default');
				$upvoteImage.removeClass('enabled');
			}
		});
	});
});

 $('#stories').on('click', '.discussion-image', function() {
	$(this).parents('.story-container').find('.discussion').toggle();
 });

function loadStories(offset) {
	$.get('/stories/approved?offset=' + offset, function(data) {
		var stories = new EJS({url: '/public/ejs/story.ejs'}).render({data: data, mode: 'show'});
		$('#stories').append(stories);
		$('#load-more').data('offset', offset + 10);
	});
}
