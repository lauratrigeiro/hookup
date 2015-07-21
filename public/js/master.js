(function($) {
	$(function() {
		Hookup.init();
	});
})(jQuery);

var Hookup = (function($) {
	var init = function() {
		initMobileMenu();
		initNavDropdowns();
		initTextareaResizer();
	};

	var initMobileMenu = function() {
		$('#menu-toggle a').click(function() {
			$('#menu-content').toggleClass('active');
		});

		// $('html').on('click touchstart', function (e) {
		//	 if(!$('.fa-bars').is(e.target) && !$('a[class^="nav-trigger"]').is(e.target)){
		//		 $('#menu-content').removeClass('active');
		//	 }
		// });
	};

	var initNavDropdowns = function() {
		$('#nav-content li, #menu-content li').click(function() {
			var $targetSubmenu = $(this).find('.dropdown');
			$('.dropdown').each(function() {
				if (!$targetSubmenu.parent().is('#menu-content li') && !$(this).is($targetSubmenu)) {
					$(this).hide();
				}
			});
			$targetSubmenu.toggle();
		});

		// $('html').on('click touchstart', function (e) {
		//	 if(!$('a[class^="nav-trigger"]').is(e.target)){
		//		 $('.dropdown').hide();
		//	 }
		// });
	};

	var initTextareaResizer = function() {
		autosize($('textarea'));
	};

	var myPublic = {
		init: init
	};

	return myPublic;
})(jQuery);
