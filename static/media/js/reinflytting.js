$(document).on('personsuper', function(e, s) {
	$('#super_'+s.id+' .name').after('<div class="separator"><div class="colorbar"></div></div>');
	$("#super_"+s.id).find('.title span').delay(1000).animate({top: "0", opacity: 1}, 500).delay(4800).animate({top: "-150px"});
	$("#super_"+s.id).find('.colorbar').animate({width: "224px"}, 700, 'linear').delay(4800).animate({width: "0"}, 500);
	$("#super_"+s.id).find('.name span').delay(1000).animate({bottom: "0", opacity: 1}, 500).delay(4800).animate({bottom: "-150px"});
	// $('<video src="media/gfx/hornoya/uin.webm" autoplay></video>').appendTo("#super_"+s.id);
});


$(document).on('digassuper', function(e, s) {
	$('.digassuper .digas_title').after('<div class="separator"><div class="colorbar"></div></div>');
	$('.digassuper').find('.digas_extra span').delay(1000).animate({top: "0", opacity: 1}, 500).delay(4800).animate({top: "-150px"});
	$(".digassuper").find('.colorbar').animate({width: "224px"}, 700, 'linear').delay(4800).animate({width: "0"}, 500);
	$(".digassuper").find('.digas_title span').delay(1000).animate({bottom: "0", opacity: 1}, 500).delay(4800).animate({bottom: "-150px"});
});
