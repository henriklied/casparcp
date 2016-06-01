var sombiSliderInterval;


function unloadSlider() {
}



function loadSlider() {
	$('.sombiSlider img').slideshowify({
		parentEl: ".sombiSlider .shower"
	});
	$(".sombiSlider").bind('beforeFadeIn', function(e, img) {
		$(".sombiSlider h2").html(img.user);
		$(".sombiSlider p").html(img.title);
	})
}


