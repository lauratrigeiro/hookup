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

    $editButton.click(editQuestion);
    $submit.click(submitQuestion);
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
          window.location.href = $('#route').val() + '/select?id=' + result.chat_id;
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

  var myPublic = {
    init: init
  };

  return myPublic;
})(jQuery);