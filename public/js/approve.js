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
    $.post('/stories/deny',
      {
        story_id : $(this).data('story_id')
      },
      function(data) {
        $approveButton.parents('.story-container').remove();
      }
    );
  });

  $('#stories').on('click', '.edit-button', function() {
    var $storyContainer = $(this).parents('.story-container');
    var $story = $storyContainer.find(".story");
    var content = $storyContainer.data('content');
    $story.replaceWith("<textarea class='story-edit'>"+content+"</textarea>");
    $storyContainer.find(".edit-area").show();
  });

  $('#stories').on('click', '.cancel-button', function(){
    var $storyContainer = $(this).parents('.story-container');
    $storyContainer.find('.story-edit').replaceWith("<div class='story'>"+$storyContainer.data("content")+"</div>");
    $storyContainer.find('.edit-area').hide();
  });

  $('#stories').on('click', ".save-button", function(){
    var $storyContainer = $(this).parents('.story-container');
    var new_content = $storyContainer.find('textarea').val();
    var story_id = $storyContainer.data('story_id');
    $.post('/stories/edit',
      {
        story_id: story_id,
        content : new_content
      },
      function(data) {
        $storyContainer.data('content', new_content);
        $storyContainer.find('.cancel-button').click();
      }
    );
  });
});

function loadStories(offset) {
	$.get('/stories/unapproved?offset='+offset, function(data) {
      var stories = new EJS({url: "/public/ejs/story.ejs"}).render(data);
      $('#stories').append(stories);
			$('#load-more').data('offset', offset + 10);
	});
}
