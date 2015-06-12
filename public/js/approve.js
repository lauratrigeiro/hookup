$(document).ready(function() {
	var user_id = $('#this_user_id').val();

	loadStories(0);

	$('#load-more').click(function() {
		loadStories($(this).data('offset'));
	});

	$('#stories').on('click', '.approve-button', function() {
		$approveButton = $(this);
		$.ajax({
			type         : 'POST',
			url          : '/stories/approve',
			data         : JSON.stringify({
				story_id : $(this).data('story_id')
			}),
			contentType  : "application/json",
			success      : function(data) {
				$approveButton.text('Approved');
				$approveButton.prop('disabled', true);
				$approveButton.addClass('disabled');
			}
		});
	});
	$('#stories').on('click', '.deny-button', function() {
		$approveButton = $(this);
		$.ajax({
			type         : 'POST',
			url          : '/stories/deny',
			data         : JSON.stringify({
				story_id : $(this).data('story_id')
			}),
			contentType  : "application/json",
			success      : function(data) {
				$approveButton.parents('.story-container').remove();
			}
		});
	});
});

function loadStories(offset) {
	$.ajax({
		type        : 'GET',
		url         : '/stories/unapproved?offset=' + offset,
		success     : function(data) {
			data.forEach(function(story) {
				$('#stories').append('<div class="story-container">\
	      			<div class="story">' + showReturns(story.content) + '</div>\
	      			<div class="votes"><button type="button" class="approve-button btn" data-story_id="' +
	      			story.story_id + '">Approve</button>\
              <button type="button" class="deny-button btn" data-story_id="' +
	      			story.story_id + '">Deny</button>\
              </div>\
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
