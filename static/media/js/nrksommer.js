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
	<div class="program_title"></div></div>';
	$(html).appendTo("#container");
	$("#super_programsuper").fadeIn(1500);
	setTimeout(function() {
  		$("#super_programsuper .program_title").html('minutt for minutt').typeIt({ startDelay: 0, speed: 220, breakLines: false, cursor: false });

	}, 1600);
	setTimeout(function() {
		$("#super_programsuper .skovel").addClass("skovel2");
	}, 4700);
	setTimeout(function() {
		$("#super_programsuper").fadeOut(1500, function() {
			$(this).remove();
		})
	}, 8000);
});


