$(document).on('infosuper', function(e, s) {
$(document).on('personsuper', function(e, s) {
	$("#super_"+s.id).find('.title span').delay(1000).animate({top: "0", opacity: 1}, 500);
	$("#super_"+s.id).find('.name span').delay(1000).animate({bottom: "0", opacity: 1}, 500);
	$('<video src="media/gfx/hornoya/uin.webm" autoplay></video>').appendTo("#super_"+s.id);
});
$(document).on('infobox', function(e, s) {
});
