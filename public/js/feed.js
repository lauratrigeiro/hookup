$(document).ready(function() {
	var user_id = $('#this_user_id').val();
	loadChats(0);
});

function loadChats(offset) {
  var status = $("#chat-feed").data("status");
  $.get('/chats-'+status+'?offset='+offset, function(data) {
      for(var i = 0, len = data.length; i < len; i ++){
        $.get('/chats/'+data[i]['chat_id'], function(chat_data){
          var chat_node = new EJS({url: "/public/ejs/chat.ejs"}).render({data: chat_data, status: status});
          $('#chat-feed').append(chat_node);
        });
      }
  });

  $('#chat-feed').on('click', '.approve', function() {
    var $chat = $(this).parents(".chat");
    $.post("/chats/approve", {chat_id: $chat.data("chat_id")}, function(data){
      $chat.remove();
    });
  });

  $('#chat-feed').on('click', '.deny', function() {
    var $chat = $(this).parents(".chat");
    $.post("/chats/deny", {chat_id: $chat.data("chat_id")}, function(data){
      $chat.remove();
    });
  });

  $('#chat-feed').on('click', '.display-username', function() {
    var $chat = $(this).parents(".chat");
    var $input = $chat.find('#display-username-input');

    $.ajax({
      type        : 'PUT',
      url         : '/chats/display_username',
      contentType : "application/json",
      data        : JSON.stringify({
        chat_id          : $chat.data("chat_id"),
        display_username : $input.val()
      }),
      success     : function(result) {
        console.log(result);
      }
    });
  });
}

