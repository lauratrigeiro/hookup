$(document).ready(function() {
	display_sexperts();
});

function display_sexperts() {
	$.ajax({
		type        : 'GET',
		url         : '/sexperts',
		success     : function(data) {
			data.forEach(function(sexpert) {
				var sexpert_name = sexpert.username;
				var sexpert_src = '/public/images/sexperts/' + sexpert_name.toLowerCase();
				//temporary
				var sexpert_names = ['jake', 'kaitlin', 'tory']
				if (sexpert_names.indexOf(sexpert_name.toLowerCase()) < 0) {
					sexpert_src = '/public/images/sexperts/kristy_profile';
				}

				$('#sexpert-list').append('<li class="sexpert-list-item">\
    			<span class="photo"><img src="' + sexpert_src + '.png" /></span>\
    			<span class="username">' + sexpert_name + '</span>\
    			<div class="second-row">\
	    			<span class="age">' + sexpert.age + ' years old</span>\
	    			<span class=gender">' + sexpert.gender + '</span>\
	    		</div>\
    			<button class="select-sexpert-btn btn">Select</button>\
    		</li>');
			});	
		}
	});
}