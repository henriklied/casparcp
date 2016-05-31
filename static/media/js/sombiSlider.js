var sombiSliderInterval;

function loadSlider() {
	$('.sombiSlider figure').addClass("next").last().removeClass("next").addClass("current");

	sombiSliderInterval = setInterval(function() {
		$('.sombiSlider figure').css('z-index', 300);
		var nxt = $('.sombiSlider figure.current')
			.removeClass("current")
			.addClass("prev")
			.css('z-index', 9999)
			.prev();
		if (nxt.length == 0) {
			return;
		}

		nxt.addClass("current")
			.removeClass("next");
	}, 3000);  
}

function unloadSlider() {
	clearInterval(sombiSliderInterval);
}