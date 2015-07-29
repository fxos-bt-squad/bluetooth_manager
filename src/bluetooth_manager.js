/* globals evt, BluetoothLoader, GattServerManager */
(function(exports) {
  'use strict';

  var BluetoothManager = function() {};

  BluetoothManager.prototype = evt({
    _mozBluetooth: undefined,

    _defaultAdapter: undefined,

    _discoveryHandle: undefined,

    _deviceDeck: undefined,

    _gattServerManager: undefined,

    init: function bm_init() {
      this._mozBluetooth = BluetoothLoader.getMozBluetooth();
      this._gattServerManager = new GattServerManager();
      this._gattServerManager.init(this);
      this._mozBluetooth.addEventListener('attributechanged', this);
      this.setDefaultAdapter(this._mozBluetooth.defaultAdapter);
    },

    setDefaultAdapter: function bm_setDefaultAdapter(adapter) {
      if (!adapter) {
        return;
      }

      if (this._defaultAdapter) {
        // reset default adapter, remove event handler on it
        this._defaultAdapter.removeEventListener('attributechanged', this);
      }
      this._defaultAdapter = adapter;
      this._defaultAdapter.addEventListener('attributechanged', this);
      this.fire('default-adapter-ready', {adapter: this._defaultAdapter});
    },

    onAttributeChanged: function bm_onAttributeChanged(evt) {
      var that = this;
      [].forEach.call(evt.attrs, function(attr, index) {
        console.log(attr + ' changed');
        if (attr === 'defaultAdapter') {
          that.setDefaultAdapter(that._mozBluetooth.defaultAdapter);
        }
      });
    },

    handleEvent: function bm_handleEvent(evt) {
      switch(evt.type) {
        case 'attributechanged':
          this.onAttributeChanged(evt);
          break;
        case 'devicefound':
          this.onDeviceFound(evt);
          break;
      }
    },

    _keepDiscoveryHandle: function bm_keepDiscoveryHandle(handle) {
      this._discoveryHandle = handle;
      this._discoveryHandle.addEventListener('devicefound', this);
    },

    _startDiscovery: function bm_startDiscovery() {
      var that = this;
      if (!this._defaultAdapter) {
        return Promise.reject('default adapter is not existed');
      }

      if (this._defaultAdapter.state !== 'enabled') {
        return this._defaultAdapter.enable().then(function() {
          return that._defaultAdapter.startDiscovery();
        }).then(this._keepDiscoveryHandle.bind(this));
      }

      return this._defaultAdapter.startDiscovery().then(
        this._keepDiscoveryHandle.bind(this));
    },

    _stopDiscovery: function bm_stopDiscovery() {
      if (!this._defaultAdapter) {
        return Promise.reject('default adapter is not existed');
      }

      // force to stop anyway
      return this._defaultAdapter.stopDiscovery();
    },

    safelyStartDiscovery: function bm_safelyStartDiscovery() {
      var that = this;
      if (!this._defaultAdapter) {
        return new Promise(function(resolve, reject) {
          that.on('default-adapter-ready', function() {
            resolve(this._startDiscovery());
          });
        });
      }
      return this._startDiscovery();
    },

    safelyStopDiscovery: function bn_safelyStopDiscovery() {
      return this._stopDiscovery().catch(function(reason) {
        console.warn('failed to stop discovery: ' + reason);
      });
    },

    onDeviceFound: function bm_onDeviceFound(evt) {
      var device = evt.device;
      this.fire('device-found', device);
    }
  });

  exports.BluetoothManager = BluetoothManager;
}(window));
