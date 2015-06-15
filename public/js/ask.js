(function($) {
  $(function() {
    AskSexpert.init();
  });  
})(jQuery);

var AskSexpert = (function($) {
//  var sexpertCount = Math.floor(Math.random() * 4); //generating random data for testing
  var $form = $('.question-form');
  var $submit = $form.find('#submit');
  var $questionField = $form.find('#description');
  var $editButton = $form.find('#edit-question');
  var $availableSexperts = $form.find('#available-sexperts');
  var $sexpertQueue = $form.find('#sexpert-queue');

  var init = function (){
 //   getAvailableSexperts();
  getOpenChats();

    $editButton.click(editQuestion);
    $submit.click(submitQuestion);

    $('.user-chats-container').on('click', '.select-chat', function() {
      window.open($('#route').val() + '/chat?id=' + $(this).data('chat_id'), 'blank');
    });
  };

  var getOpenChats = function() {
    $.ajax({
      type        : 'GET',
      url         : '/chats/me',
      success     : function(data) {
        if (!data.length) {
          return;
        }

        var appendString = '<h2>Open Chats</h2>\
          <div class="user-chats">\
            <p class="header-row"><span class="resume-button"></span>\
              <span class="date">Date</span>\
              <span class="sexpert">Sexpert</span>\
              <span class="content">Question</span>\
            </p>';

        data.forEach(function(row) {
          appendString += '<p>\
            <span class="resume-button first"><button class="select-chat btn" data-chat_id="' + row.chat_id + '">Resume Chat</button></span>\
            <span class="date">' + getCurrentDate(new Date(row.created_ts * 1000)) + '</span>\
            <span class="sexpert"><span class="sexpert-label">Sexpert: </span>' + row.sexpert_username + '</span>\
            <span class="content">' + (row.content.length > 50 ? row.content.slice(0, 50) + '...' : row.content) + '</span>\
            <span class="resume-button last"><button class="select-chat btn" data-chat_id="' + row.chat_id + '">Resume Chat</button></span>\
          </p>';
        });

        appendString += '</div>';

        $('.user-chats-container').append(appendString);
      }
    });
  };

  var editQuestion = function(e){
    $editButton.hide();
    $availableSexperts.hide();
    $sexpertQueue.hide();
    $questionField.prop('disabled', false).focus();
    $submit.val('Hookup');
    return false;
    e.stopImmediatePropagation();
  };

  var submitQuestion = function(){
    $submit.val('Just a moment to hookup...');
    $questionField.prop('disabled', true);
    // $editButton.show();
    // $availableSexperts.show().find('#sexpert-count').text(sexpertCount);
    // if(sexpertCount == 0){
    //   $sexpertQueue.show().text('You are 2 in queue. It will be 3 mins.');
    // } 
    $.ajax({
      type        : 'POST',
      url         : '/chats/create',
      contentType : "application/json",
      data        : JSON.stringify({
        content   : $questionField.val()
      }),
      success     : function(result) {
   //     if ($group === 'A') {
          window.open($('#route').val() + '/select?id=' + result.chat_id, 'blank');
        // } else {
        //   window.open($('#route').val() + '/chat?id=' + result.chat_id, 'blank');
        // }
      },
      error       : function() {
        $('#message').html("Sorry, an error occurred.");
      },
      async: false
    });
  };

  var getAvailableSexperts = function() {
    $.ajax({
      type        : 'GET',
      url         : '/sexperts/active',
      success     : function(data) {
        $('#sexpert-count').text(data.active);
        $availableSexperts.show();
      }
    });
  };

  var getCurrentDate = function(date) {
    var month = date.getMonth() + 1;
    if (month < 10) {
      month = '0' + month;
    }

    var day = date.getDate();
    if (day < 10) {
      day = '0' + day;
    }

    return month + '/' + day + '/' + date.getFullYear().toString().slice(2);
}

  var myPublic = {
    init: init
  };

  return myPublic;
})(jQuery);