$(document).ready(function() {
	var user_id = $('#this_user_id').val();

	loadStories(0);

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
				$('#share-alert').html("Cool story, bro. It'll be up soon.");
				$storyInput.css('height', '');
				$storyInput.prop('rows', '1');
				$storyInput.val('');
			},
			error       : function() {
				$('#alert').html("Sorry, we had trouble submitting your amazing story.");
			}
		});
	});

	$('#load-more').click(function() {
		loadStories($(this).data('offset'));
	});

	$('#stories').on('click', '.upvote-image.enabled', function() {
		$upvoteImage = $(this);
		$.ajax({
			type         : 'POST',
			url          : '/stories/upvote',
			data         : JSON.stringify({
				story_id : $upvoteImage.prev().data('story_id')
			}),
			contentType  : "application/json",
			success      : function(data) {
				var prev_upvotes = parseInt($upvoteImage.prev().text());
				$upvoteImage.prev().html(prev_upvotes+1);
				$upvoteImage.prop('src', '/public/images/condom_selected.png')
				$upvoteImage.css('cursor', 'default');
				$upvoteImage.removeClass('enabled');
			}
		});
	});
});

function loadStories(offset) {
	$.ajax({
		type        : 'GET',
		url         : '/stories/approved?offset=' + offset,
		success     : function(data) {
			data.forEach(function(story) {
				$('#stories').append('<div class="story-container">\
	      			<div class="story">' + showReturns(story.content) + '</div>\
	      			<div class="votes"><span class="upvotes" data-story_id="' +
	      			story.story_id + '">' + (1+story.upvotes) + '</span><img class="upvote-image enabled"\
	      			 src="/public/images/condom_unselected.png" /></div>\
	      			<div class="byline">\
	      				<img src="/public/images/clock.png" /><span class="date">' +
	      				writeDate(story.created) + '</span><span class="author"></span></div>\
	      			<div class="clear"></div>\
	      		</div>');
			});

			$('#load-more').data('offset', offset + 10);
		}
	});
}

function writeDate(timestamp) {
	// given unix timestamp
	var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	var date = new Date(timestamp * 1000);
	return ' ' + months[date.getMonth()] + ' ' + date.getDate();
}

function showReturns(str) {
	return str.replace(/(?:\r\n|\r|\n)/g, '<br />');
}
