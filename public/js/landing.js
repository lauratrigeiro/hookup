$(document).ready(function() {

	$.ajax({
		type        : 'GET',
		url         : 'test',
	    contentType : "application/json",
		success     : function(result) {
			$('#color').html(result.color);
		}
	});
});