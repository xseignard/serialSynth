window.onload = function() {
	var audio = new Synth.Audio({
		sound: 'sound/OGLikeCapone.ogg'
	});

	var serial = new Synth.Serial(function(data) {
		console.log(data);
		audio.update(data);
	});

};