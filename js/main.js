window.onload = function() {
	var audio = new Synth.Audio();

	var serial = new Synth.Serial(function(data) {
		console.log(data);
		audio.update(data);
	});

};