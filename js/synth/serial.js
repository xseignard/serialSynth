(function($) {

  /**
   * Initialize serial port picker and serial connection
   * Inspired by: http://renaun.com/blog/2013/05/using-the-chrome-serial-api-with-arduino/
   */
  var Serial = function(process) {
    // fake connection id until we actually connect to a serial port
    this.connectionId = -1;
    // buffer to store reads
    this.buffer = '';
    // process function that will handle the read data
    this.process = process;
    // list and open the port
    var self = this;
    chrome.serial.getPorts(function(ports) {
       self.buildPortPicker(ports)
       self.openSelectedPort();
    });
  };
  
  /**
   * Handle the opening of the port
   * @param {Object} openInfo - Object containing the new connection ID
   */
  Serial.prototype.onOpen = function(openInfo) {
    this.connectionId = openInfo.connectionId;
    console.log('connectionId: ' + this.connectionId);
    if (this.connectionId == -1) {
      this.setStatus('Could not open');
      return;
    }
    this.setStatus('Connected!');
    var self = this;
    chrome.serial.read(this.connectionId, 1, function(readInfo) {
      self.read.call(self, readInfo);
    });
  };

  /**
   * Convenience function to update the serial connection status on the UI
   * @param {String} status - the new message status to display
   */
  Serial.prototype.setStatus = function(status) {
    $('#serialport').text(status);
  };

  /**
   * Constructs the port picker
   * @param {Array} ports - an array of String representing the serial ports of the machine
   */
  Serial.prototype.buildPortPicker = function(ports) {
    var portPicker = $('#port-picker');
    ports.forEach(function(port) {
      // don't handle internal linux ttys
      if (port.indexOf('ttyS') === -1) {
        portPicker.append('<option value=' + port + '>' + port + '</option>');
      }
    });
    var self = this;
    // when the selection is changed, close the previous serial port and open the new one
    portPicker.change(function() {
      if (self.connectionId != -1) {
        chrome.serial.close(self.connectionId, function() {
          self.openSelectedPort.call(self)
        });
        return;
      }
      self.openSelectedPort();
    });
  };

  /**
   * Open the selected port
   */
  Serial.prototype.openSelectedPort = function() {
    var selectedPort = $('#port-picker option:selected').val();
    if (selectedPort) {
      var self = this;
      chrome.serial.open(selectedPort, function(openInfo) {
        self.onOpen.call(self, openInfo);
      });
    }
    else {
      this.setStatus('No serial port available');
    }
  };

  /**
   * Close the opened port
   */
  Serial.prototype.closePort = function() {
    chrome.serial.close(this.connectionId);
  };

  /**
   * Read data through the opened serial port
   */
  Serial.prototype.read = function(readInfo) {
    var uint8View = new Uint8Array(readInfo.data);
    if (uint8View[0]) this.buffer += String.fromCharCode(uint8View[0]);
    
    if (this.buffer.indexOf('}') > -1) {
      // if you don't receive a whole message JSON.parse will throw an error
      try {
        var data = JSON.parse(this.buffer);
        this.process(data);
      }
      catch (exc) {
        console.log('Failed to decode the serial data');
      }
      finally {
        this.buffer = '';
      }
    }
    var self = this;
    chrome.serial.read(this.connectionId, 1, function(readInfo) {
      self.read.call(self, readInfo);
    });
  };

  if (!window.Synth) window.Synth = {};
  window.Synth.Serial = Serial;
})($);