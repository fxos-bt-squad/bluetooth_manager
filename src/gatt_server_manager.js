/* globals evt */
'use strict';

(function(exports) {
  var FakeGattServer = {
    isFake: true,
    services: [],
    connect: function(address) {
      console.log('invoke FakeGattServer.connect');
      return Promise.resolve();
    },
    disconnect: function(address) {
      console.log('invoke FakeGattServer.disconnect');
      return Promise.resolve();
    },
    addService: function(service) {
      console.log('invoke FakeGattServer.addService');
      return Promise.resolve();
    },
    removeService: function(service) {
      console.log('invoke FakeGattServer.removeService');
      return Promise.resolve();
    },
    notifyCharacteristicChanged:
      function(address, uuid, instanceId, confirm) {
        console.log('invoke FakeGattServer.notifyCharacteristicChanged');
        return Promise.resolve();
      },
    sendResponse: function(address, status, requestId, value) {
      console.log('invoke FakeGattServer.sendResponse');
      return Promise.resolve();
    },
    addEventListener: function() {
      console.log('invoke FakeGattServer.addEventListener');
    },
    removeEventListener: function() {
      console.log('invoke FakeGattServer.removeEventListener');
    }
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

    onDefaultAdapterReady: function(detail) {
      var adapter = detail.adapter;
      // we'll fake BluetoothGattServer until API is ready
      this._gattServer = adapter.gattServer || FakeGattServer;
      this._gattServer.addEventListener('deviceconnectionstatechanged', this);
      this._gattServer.addEventListener('attributereadreq', this);
      this._gattServer.addEventListener('attributewritereq', this);
    },

    connect: function(address) {
      if (!this._gattServer) {
        return Promise.reject('gatt server does not exist');
      }
      return this._gattServer.connect(address);
    },

    disconnect: function(address) {
      if (!this._gattServer) {
        return Promise.reject('gatt server does not exist');
      }
      return this._gattServer.disonnect(address);
    },

    handleEvent: function(evt) {
      var type = evt.type;
      console.log('receive ' + type + ' from gatt server');
      switch(type) {
        case 'deviceconnectionstatechanged':
          this.fire('device-connection-state-changed', {
            address: evt.address,
            connected: evt.connected
          });
          break;
      }
    }

  });

  exports.GattServerManager = GattServerManager;
}(window));
