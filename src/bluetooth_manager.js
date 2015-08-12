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

    _discovering: false,

    get discovering () {
      return this._discovering;
    },

    set discovering (value) {
      if (value !== this._discovering) {
        console.log(this._discovering + ' -> ' + value);
        this._discovering = value;
        this.fire('discovering-state-changed', value);
        if (value) {
          this.fire('start-discovering');
        } else {
          this.fire('stop-discovering');
        }
      }
    },

    _state: 'disabled',
    get state () {
      return this._state;
    },

    set state (value) {
      if (value !== this._state) {
        console.log(this._state + ' -> ' + value);
        this._state = value;

        this.fire('state-changed', value);
        if (value === 'enabled') {
          this.fire('enabled');
        } else if (value === 'disabled') {
          this.fire('disabled');
        }
      }
    },

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
        console.log('attribute: ' + attr + ' changed');
        switch(attr) {
          case 'defaultAdapter':
            that.setDefaultAdapter(that._mozBluetooth.defaultAdapter);
            break;
          case 'discovering':
            that.discovering = that._defaultAdapter.discovering;
            break;
          case 'state':
            that.state = that._defaultAdapter.state;
            break;
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

    _removeDiscoveryHandleIfAny: function bm_removeDiscoveryHandleIfAny() {
      if (this._discoveryHandle) {
        this._discoveryHandle.removeEventListener('devicefound', this);
        this._discoveryHandle = undefined;
      }
    },

    _startDiscovery: function bm_startDiscovery() {
      var that = this;

      this._removeDiscoveryHandleIfAny();

      if (!this._defaultAdapter) {
        return Promise.reject('default adapter does not exist');
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
        return Promise.reject('default adapter does not exist');
      }

      // force to stop anyway
      return this._defaultAdapter.stopDiscovery();
    },

    _waitForAdapterReadyThen: function(callback, context, args) {
      var that = this;
      return new Promise(function(resolve, reject) {
        that.on('default-adapter-ready', function() {
          resolve(callback.apply(context, args));
        });
      });
    },

    safelyStartDiscovery: function bm_safelyStartDiscovery() {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(this._startDiscovery, this);
      }
      return this.safelyStopDiscovery().then(this._startDiscovery.bind(this));
    },

    safelyStopDiscovery: function bn_safelyStopDiscovery() {
      return this._stopDiscovery().catch(function(reason) {
        console.warn('failed to stop discovery: ' + reason);
      });
    },

    safelyDisable: function bm_safelyDisable() {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(
          this._disable, this);
      }
      return this._disable().catch(function(reason) {
        console.warn('failed to disable: ' + reason);
      });
    },

    _disable: function bm_disable() {
      return this._defaultAdapter.disable();
    },

    _startLeScan: function bm_startLeScan(uuids) {
      // TODO: consolidate with _startDiscovery maybe
      var that = this;
      if (!this._defaultAdapter) {
        return Promise.reject('default adapter does not exist');
      }

      if (this._defaultAdapter.state !== 'enabled') {
        return this._defaultAdapter.enable().then(function() {
          return that._defaultAdapter.startLeScan(uuids);
        }).then(this._keepDiscoveryHandle.bind(this));
      }

      return this._defaultAdapter.startLeScan(uuids).then(
        this._keepDiscoveryHandle.bind(this));
    },

    _stopLeScan: function bm_stopLeScan() {
      if (!this._defaultAdapter) {
        return Promise.reject('default adapter does not exist');
      }

      if (!this._discoveryHandle) {
        return Promise.reject('discovery handle does not exist');
      }

      // force to stop anyway
      return this._defaultAdapter.stopLeScan(this._discoveryHandle);
    },

    safelyStartLeScan: function bm_safelyStartLeScan(uuids) {
      uuids = uuids || [];
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(
          this._startLeScan, this, [uuids]);
      }
      // TODO: should invoke stopLeScan before startLeScan
      return this._startLeScan(uuids);
    },

    safelyStopLeScan: function bm_safelyStopLeScan() {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(this._stopLeScan, this);
      }
      return this._stopLeScan().catch(function(reason) {
        console.warn('failed to stop le scan: ' + reason);
      });
    },

    onDeviceFound: function bm_onDeviceFound(evt) {
      var device = evt.device;
      this.fire('device-found', device);
    },

    // TODO: should have a better name
    gattServerConnect: function bm_gattServerConnect(address) {
      return this._gattServerManager.connect(address);
    },

    gattServerDisconnect: function bm_gattServerDisconnect(address) {
      return this._gattServerManager.disconnect(address);
    }
  });

  exports.BluetoothManager = BluetoothManager;
}(window));
