(function($) {

    // convenient function to map values
    var map = function(value, srcMin, srcMax, destMin, destMax){
        if (value < srcMin || value > srcMax){
            return NaN; 
        }
        var srcRange = srcMax - srcMin,
            dstRange = destMax - destMin,
            adjValue = value - srcMin;

        return (adjValue * dstRange / srcRange) + destMin;
    };

    /**
     * Create the audio context and nodes of the Synth
     */
    var Audio = function(opts) {
        this.audioContext = new webkitAudioContext();
        // 
        if (opts && opts.sound) {
            this.sound = opts.sound;
        }

        // some min/max values for the filter
        // min 40Hz
        this.min = 40; 
        // max is half of the sampleRate
        this.max = this.audioContext.sampleRate / 2;
        // create the nodes
        this.nodes = {};
        this.nodes.oscVolume = this.audioContext.createGain();
        this.nodes.filter = this.audioContext.createBiquadFilter();
        this.nodes.volume = this.audioContext.createGain();
        this.nodes.delay = this.audioContext.createDelay();
        this.nodes.feedbackGain = this.audioContext.createGain();
        this.nodes.compressor = this.audioContext.createDynamicsCompressor();
        // connect the nodes and start playing
        this.connectNodes();
    };

    /**
     * Connect the nodes and start playing
     */
    Audio.prototype.connectNodes = function() {
        // if we want to play a sound rather than an oscillator
        if (this.sound) {
            this.source = this.audioContext.createBufferSource();
            this.loadSound();
        }
        else {
            this.source = this.audioContext.createOscillator();
            this.source.type = 'sine';
        }
        // some starting values values for the nodes
        this.nodes.feedbackGain.gain.value = 0.4;
        this.nodes.delay.delayTime.value = 0.5;
        //this.source.frequency.value = 200;
        this.nodes.filter.frequency.value = 200;
        // these values won't be touched
        this.nodes.filter.type = 'lowpass';
        this.nodes.volume.gain.value = 0.4;
        this.nodes.oscVolume.gain.value = 1;
        // connect the nodes
        this.source.connect(this.nodes.oscVolume);
        this.nodes.oscVolume.connect(this.nodes.filter);
        this.nodes.filter.connect(this.nodes.compressor);
        this.nodes.filter.connect(this.nodes.delay);
        this.nodes.delay.connect(this.nodes.feedbackGain);
        this.nodes.delay.connect(this.nodes.compressor);
        this.nodes.feedbackGain.connect(this.nodes.delay);
        this.nodes.compressor.connect(this.nodes.volume);
        this.nodes.volume.connect(this.audioContext.destination);
        // start the oscillator now if needed
        if (!this.sound) this.source.start(0);
    };

    /**
     * Load the sound
     */
    Audio.prototype.loadSound = function() {
        // request the sound
        var request = new XMLHttpRequest();
        request.open('GET', this.sound, true);
        request.responseType = 'arraybuffer';
        var self = this;
        // when data is loaded, send it to the audio context
        request.onload = function() {
            // decode the data
            self.audioContext.decodeAudioData(
                request.response, 
                // when the audio is decoded play the sound
                function(buffer) {
                    // sets the recieved sound as the buffer of the source node
                    self.source.buffer = buffer;
                    // schedule to play the sound right now
                    self.source.start(0);
                },
                function(err) {
                    console.log('Error while retrieving sound : ' + err);
                }
            );
        };
        // send the request
        request.send();
    };

    /**
     * Update values of the filter, delay and gain
     * @param {Object} data - some object with the right properties to update the nodes
     */
    Audio.prototype.update = function(data) {
        this.source.frequency.value = map(data.fr, 0,1023, 0, 1000);
        this.nodes.filter.frequency.value = map(data.fi, 0,1023, this.min, this.max);
        this.nodes.delay.delayTime.value = map(data.de, 0, 1023, 0, 0.999);
        this.nodes.feedbackGain.gain.value = map(data.fe, 0, 1023, 0, 0.9);
    };

  if (!window.Synth) window.Synth = {};
  window.Synth.Audio = Audio;
})($);