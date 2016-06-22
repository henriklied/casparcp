var sombiSliderInterval;


function unloadSlider() {
}



function loadSlider() {
	$('.sombiSlider img').slideshowify({
		parentEl: ".sombiSlider .shower"
	});
	$(".sombiSlider").bind('beforeFadeIn', function(e, img) {
		$(".sombiSlider h2").remove();
		$(".sombiSlider p").remove();
		$("<h2/>").appendTo('.sombiSlider .title');
		$("<p/>").appendTo('.sombiSlider .desc');
		$(".sombiSlider h2").html(img.user);
		$(".sombiSlider p").html(img.title);
		$(".sombiSlider h2").typeIt({  speed: 30, breakLines: true, cursor: false });
		// $(".sombiSlider p").typeIt({ startDelay: 1000, speed: 30, breakLines: true, cursor: false });

	});
}


