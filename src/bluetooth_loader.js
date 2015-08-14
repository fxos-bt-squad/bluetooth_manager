(function (exports) {
  'use strict';
  /**
   * This module helps us load a fake mozBluetooth module if we are in an
   * environment where there is no navigator.mozBluetooth
   * @module BluetoothLoader
   */
  exports.BluetoothLoader = {
    // on b2g-desktop, we don't have mozBluetooth API, so we inject fake one
    // just to make sure we won't break TV build on b2g-desktop
    _fakeMozBluetooth: {
      addEventListener: function() {},
      defaultAdapter: {
        _discoveryHandle: {
          addEventListener: function() {}
        },
        state: 'disabled',
        enable: function() {
          return Promise.resolve();
        },
        disable: function() {
          return Promise.resolve();
        },
        startDiscovery: function() {
          return Promise.resolve(this._discoveryHandle);
        },
        stopDiscovery: function() {
          return Promise.resolve();
        },
        addEventListener: function() {},
        removeEventListener: function() {},
        pair: function() {
          return Promise.resolve();
        },
        unpair: function() {
          return Promise.resolve();
        }
      }
    },

    /**
     * @public
     * @method getMozBluetooth
     * @return {BluetoothManager} returns either a real
     *                  [BluetoothManager](http://mzl.la/1N6MoNp) or a fake one
     */
    getMozBluetooth: function() {
      if (navigator.mozBluetooth) {
        return navigator.mozBluetooth;
      } else {
        return this._fakeMozBluetooth;
      }
    }
  };

}(window));
