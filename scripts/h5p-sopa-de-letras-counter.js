(function (SopaDeLetras) {
  /**
   * Keeps track of the number of times the game is submitted.
   * @class H5P.SopaDeLetras.Counter
   * @param {H5P.jQuery} $container
   */

  SopaDeLetras.Counter = function ($container) {
    /** @alias H5P.SopaDeLetras.Counter# */
    var self = this;
    var current = 0;
    /**
     * @private
     */
    var update = function () {
      $container[0].innerText = current;
    };

    /**
     * Increment the counter.
     */
    self.increment = function () {
      current++;
      update();
    };
    /**
     * Revert counter back to its natural state
     */
    self.reset = function () {
      current = 0;
      update();
    };
  };

})(H5P.SopaDeLetras);
