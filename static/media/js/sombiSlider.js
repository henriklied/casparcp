var sombiSliderInterval;

function loadSlider() {
	$('.sombiSlider figure').addClass("next").last().removeClass("next").addClass("current");

	sombiSliderInterval = setInterval(function() {
		var nxt = $('.sombiSlider figure.current')
			.removeClass("current")
			.addClass("prev")
			.prev();
		if (nxt.length == 0) {
			return;
		}

		nxt.addClass("current")
			.removeClass("next");
	}, 5000);  
}

function unloadSlider() {
	clearInterval(sombiSliderInterval);
}