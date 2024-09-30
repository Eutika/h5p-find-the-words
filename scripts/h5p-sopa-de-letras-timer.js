(function (SopaDeLetras, Timer) {

  /**
   * SopaDeLetras.Timer - Adapter between Find the words and H5P.Timer.
   * @class H5P.SopaDeLetras.Timer
   * @extends H5P.Timer
   * @param {H5P.jQuery} $element
   */
  SopaDeLetras.Timer = function ($element) {
    /** @alias H5P.SopaDeLetras.Timer# */
    const that = this;
    // Initialize event inheritance
    Timer.call(that, 100);

    /** @private {string} */
    const naturalState = '0:00';

    /**
     * update - Set up callback for time updates.
     * Formats time stamp for humans.
     *
     * @private
     */
    const update = function () {
      const time = that.getTime();

      const minutes = Timer.extractTimeElement(time, 'minutes');
      let seconds = Timer.extractTimeElement(time, 'seconds') % 60;
      if (seconds < 10) {
        seconds = '0' + seconds;
      }
      $element.text(minutes + ':' + seconds);
    };

    // Setup default behavior
    that.notify('every_tenth_second', update);
    that.on('reset', function () {
      $element.text(naturalState);
      that.notify('every_tenth_second', update);
    });
  };

  // Inheritance
  SopaDeLetras.Timer.prototype = Object.create(Timer.prototype);
  SopaDeLetras.Timer.prototype.constructor = SopaDeLetras.Timer;

}) (H5P.SopaDeLetras, H5P.Timer);
