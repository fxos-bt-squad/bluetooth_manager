/* globals evt */
'use strict';

(function(exports) {
  var FakeGattServer = {
    services: [],
    connect: function(address) {},
    disconnect: function(address) {},
    addService: function(service) {},
    removeService: function(service) {},
    notifyCharacteristicChanged:
      function(address, uuid, instanceId, confirm) {},
    sendResponse: function(address, status, requestId, value) {}
  };

  var GattServerManager = function() {};

  GattServerManager.prototype = evt({
    _bluetoothManager: undefined,
    _gattServer: undefined,

    init: function(bluetoothManager) {
      this._bluetoothManager = bluetoothManager;
      this._bluetoothManager.on('default-adapter-ready',
        this.onDefaultAdapterReady.bind(this));
    },

    onDefaultAdapterReady: function(adapter) {
      // we'll fake BluetoothGattServer until API is ready
      this._gattServer = adapter.gattServer || FakeGattServer;
      console.log(this._gattServer);
    }

  });

  exports.GattServerManager = GattServerManager;
}(window));
