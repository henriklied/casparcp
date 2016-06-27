$(document).on('personsuper', function(e, s) {
	if (!$("#super_"+s.id).hasClass("bottomleft")) {
		return;
	}
	$("#super_"+s.id).addClass("padded");
	$('<div class="cogwheel"><img src="media/gfx/nrksommer/logo.png"><div class="cropper"><div class="skovel"><img src="media/gfx/nrksommer/skovel.png"></div></div></div>').appendTo("#super_"+s.id);
});


