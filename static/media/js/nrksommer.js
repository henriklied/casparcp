$(document).on('personsuper', function(e, s) {
	if (!$("#super_"+s.id).hasClass("bottomleft")) {
		return;
	}
	$("#super_"+s.id).addClass("padded");
	$('<div class="cogwheel"><img src="media/gfx/nrksommer/logo.png"><div class="cropper"><div class="skovel"><img src="media/gfx/nrksommer/skovel.png"></div></div></div>').appendTo("#super_"+s.id);
});

$(document).on('run_programsuper', function(e) {
	var html = '<div class="super programsuper" id="super_programsuper">\
	<div class="hjul"><div class="logo"><img src="media/gfx/nrksommer/logo_white.png"></div>\
	<div class="cropper"><div class="skovel"><img src="media/gfx/nrksommer/skovel_white.png"></div>\
	</div></div>\
	<div class="program_title">minutt for minutt</div></div>';
	$(html).appendTo("#container");
	$("#super_programsuper").fadeIn(1500);
	$("#super_programsuper .program_title").letterfx({ fx: 'smear', fx_duration: '5s'});
	setTimeout(function() {
		$("#super_programsuper .skovel").addClass("skovel2");
	}, 4700);
});


