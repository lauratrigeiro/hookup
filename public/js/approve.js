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
    var $storyContainer = $(this).parents('.story-container'),
        new_content = $storyContainer.find('textarea').val(),
        story_id = $storyContainer.data('story_id'),
        $discussion = $storyContainer.find(".discussion-message"),
        discussion = [];
    for(var i = 0, len = $discussion.length; i < len; i++){
      var node = $discussion[i];
      discussion.push([$(node).find("select").val(), $(node).find("textarea").val()]);
    }
    discussion = JSON.stringify(discussion);
    console.log(discussion);
    $.post('/stories/edit',
      {
        story_id: story_id,
        content : new_content,
        discussion: discussion
      },
      function(data) {
        $storyContainer.data('content', new_content);
        $storyContainer.find('.cancel-button').click();
      }
    );
  });

  $('#stories').on('click', ".add-discussion", function(){
    var $storyContainer = $(this).parents('.story-container');
    var $dC = $(this).siblings('.discussion');
    $dC.append(' \
      <div class="discussion-message"> \
        <button class="remove-discussion">Remove</button> \
        <select name="name"> \
          <option value="drdick">Dr. Dick</option> \
          <option value="susanb">Susan B.</option> \
          <option value="jack">Jack</option> \
        </select> \
        <textarea></textarea> \
      </div> \
    ');
  });


  $('#stories').on('click', ".remove-discussion", function(){
    $(this).parent().remove();
  });


});

function loadStories(offset) {
	$.get('/stories/unapproved?offset='+offset, function(data) {
      var stories = new EJS({url: "/public/ejs/story.ejs"}).render({data: data, mode: "approve"});
      $('#stories').append(stories);
			$('#load-more').data('offset', offset + 10);
	});
}
