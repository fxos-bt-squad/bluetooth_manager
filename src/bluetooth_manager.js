/* globals evt, BluetoothLoader, GattServerManager */
(function(exports) {
  'use strict';

  /**
   * @class BluetoothManager
   * @requires  {@link GattServerManager}
   * @requires  BluetoothLoader
   * @requires  evt
   * @fires BluetoothManager#discovering-state-changed
   * @fires BluetoothManager#start-discovering
   * @fires BluetoothManager#stop-discovering
   * @fires BluetoothManager#state-changed
   * @fires BluetoothManager#enabled
   * @fires BluetoothManager#disabled
   * @fires BluetoothManager#default-adapter-ready
   * @fires BluetoothManager#device-found
   * @fires BluetoothManager#device-paired
   * @fires BluetoothManager#device-unpaired
   * @fires BluetoothManager#display-passkey-req
   */
  var BluetoothManager = function() {};

  BluetoothManager.prototype = evt({
    _mozBluetooth: undefined,

    _defaultAdapter: undefined,

    _discoveryHandle: undefined,

    _gattServerManager: undefined,

    _pairPermission: false,

    _discovering: false,
    /**
     * Indicate whether the default adapter of BluetoothManager is in
     * discoverying state
     * @member {Boolean} BluetoothManager#discoverying
     */
    get discovering () {
      return this._discovering;
    },

    set discovering (value) {
      if (value !== this._discovering) {
        console.log(this._discovering + ' -> ' + value);
        this._discovering = value;
        /**
         * @event BluetoothManager#discovering-state-changed
         * @type {Boolean}
         */
        this.fire('discovering-state-changed', value);
        if (value) {
          /**
           * @event BluetoothManager#start-discovering
           */
          this.fire('start-discovering');
        } else {
          /**
           * @event BluetoothManager#stop-discovering
           */
          this.fire('stop-discovering');
        }
      }
    },

    _state: 'disabled',
    /**
     * Indicate the stae of default adapter of BluetoothManager.
     * It could be in one of the four states:
     * 1. enabling
     * 2. enabled
     * 3. disabling
     * 4. disabled
     *
     * see [http://mzl.la/1PoCOnu](http://mzl.la/1PoCOnu) for more information
     * @member {String} BluetoothManager#state
     */
    get state () {
      return this._state;
    },

    set state (value) {
      if (value !== this._state) {
        console.log(this._state + ' -> ' + value);
        this._state = value;

        /**
         * @event BluetoothManager#state-changed
         * @type {String}
         */
        this.fire('state-changed', value);
        if (value === 'enabled') {
          /**
           * @event BluetoothManager#enabled
           */
          this.fire('enabled');
        } else if (value === 'disabled') {
          /**
           * @event BluetoothManager#disabled
           */
          this.fire('disabled');
        }
      }
    },

    /**
     * Initialize BluetoothManager
     * @public
     * @method BluetoothManager#init
     * @param  {Boolean} pairPermission - does the app which uses
     *                                  BluetoohtManager has pair permission?
     *                                  See also
     *                                  [bug 1192695](http://bugzil.la/1192695)
     */
    init: function bm_init(pairPermission) {
      this._mozBluetooth = BluetoothLoader.getMozBluetooth();
      this._pairPermission = pairPermission;
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
        this._defaultAdapter.removeEventListener('devicepaired', this);
        this._defaultAdapter.removeEventListener('deviceunpaired', this);
        this._defaultAdapter.removeEventListener('pairingaborted', this);
        if (this._pairPermission && this._defaultAdapter.pairingReqs) {
          this._defaultAdapter.pairingReqs.removeEventListener(
            'displaypasskeyreq', this);
          this._defaultAdapter.pairingReqs.removeEventListener(
            'enterpincodereq', this);
          this._defaultAdapter.pairingReqs.removeEventListener(
            'pairingconfirmationreq', this);
          this._defaultAdapter.pairingReqs.removeEventListener(
            'pairingconsentreq', this);
        }
      }

      this._defaultAdapter = adapter;
      this._defaultAdapter.addEventListener('attributechanged', this);
      this._defaultAdapter.addEventListener('devicepaired', this);
      this._defaultAdapter.addEventListener('deviceunpaired', this);
      this._defaultAdapter.addEventListener('pairingaborted', this);
      if (this._defaultAdapter &&
          this._pairPermission && this._defaultAdapter.pairingReqs) {
        this._defaultAdapter.pairingReqs.addEventListener(
          'displaypasskeyreq', this);
        this._defaultAdapter.pairingReqs.addEventListener(
          'enterpincodereq', this);
        this._defaultAdapter.pairingReqs.addEventListener(
          'pairingconfirmationreq', this);
        this._defaultAdapter.pairingReqs.addEventListener(
          'pairingconsentreq', this);
      }
      /**
       * @event BluetoothManager#default-adapter-ready
       * @type {Object}
       * @property {BluetoothAdapter} adapter - see
       *                      [http://mzl.la/1gFH1qV](http://mzl.la/1gFH1qV)
       */
      this.fire('default-adapter-ready', {adapter: this._defaultAdapter});
    },

    onAttributeChanged: function bm_onAttributeChanged(evt) {
      var that = this;
      [].forEach.call(evt.attrs, function(attr, index) {
        console.log('attribute: ' + attr + ' changed');
        switch(attr) {
          case 'defaultAdapter':
            if (that.discovering) {
              that.safelyStopDiscovery().then(function() {
                that.setDefaultAdapter(that._mozBluetooth.defaultAdapter);
              });
            } else {
              // TODO: we should also make sure we stop le scan before
              // touching default adapter
              that.setDefaultAdapter(that._mozBluetooth.defaultAdapter);
            }
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
          /**
           * @event BluetoothManager#device-found
           * @type {Object}
           * @property {BluetoothDevice} device - see
           *                      [http://mzl.la/1IMjCh0](http://mzl.la/1IMjCh0)
           */
          this.fire('device-found', evt.device);
          break;
        case 'devicepaired':
          /**
           * @event BluetoothManager#device-paired
           * @type {Object}
           * @property {BluetoothDevice} device - see
           *                      [http://mzl.la/1IMjCh0](http://mzl.la/1IMjCh0)
           * @property {String} address - address of the paired device
           */
          this.fire('device-paired', {
            device: evt.device,
            address: evt.address
          });
          break;
        case 'deviceunpaired':
          /**
           * @event BluetoothManager#device-unpaired
           * @type {Object}
           * @property {BluetoothDevice} device - see
           *                      [http://mzl.la/1IMjCh0](http://mzl.la/1IMjCh0)
           * @property {String} address - address of the unpaired device
           */
          this.fire('device-unpaired', {
            device: evt.device,
            address: evt.address
          });
          break;
        case 'pairingaborted':
          // TODO
          break;
        case 'displaypasskeyreq':
          /**
           * @event BluetoothManager#display-passkey-req
           * @type {Object}
           * @property {BluetoothDevice} device - see
           *                      [http://mzl.la/1IMjCh0](http://mzl.la/1IMjCh0)
           * @property {String} passkey - passkey
           */
          this.fire('display-passkey-req', {
            device: evt.device,
            passkey: evt.handle.passkey
          });
          break;
        case 'enterpincodereq':
          // TODO
          break;
        case 'pairingconfirmationreq':
          // TODO
          break;
        case 'pairingconsentreq':
          // TODO
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

    /**
     * Start discovery safely and do not worry about to enable default adapter
     * first.
     * @public
     * @method  BluetoothManager#safelyStartDiscovery
     * @return {Promise}
     */
    safelyStartDiscovery: function bm_safelyStartDiscovery() {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(this._startDiscovery, this);
      }
      return this.safelyStopDiscovery().then(this._startDiscovery.bind(this));
    },

    /**
     * Stop discovery safely.
     * @public
     * @method  BluetoothManager#safelyStopDiscovery
     * @return {Promise}
     */
    safelyStopDiscovery: function bn_safelyStopDiscovery() {
      return this._stopDiscovery().catch(function(reason) {
        console.warn('failed to stop discovery: ' + reason);
      });
    },

    /**
     * Disable default adapter safely. No need to worry about whether default
     * adpater is ready or not.
     * @public
     * @method  BluetoothManager#safelyDisable
     * @return {Promise}
     */
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

    _pair: function bm_pair(address) {
      return this._defaultAdapter.pair(address);
    },

    _unpair: function bm_unpair(address) {
      return this._defaultAdapter.unpair(address);
    },

    _setDiscoverable: function bm_setDiscoverable(value) {
      return this._defaultAdapter.setDiscoverable(value);
    },

    /**
     * Start LE scan safely and do not worry about to enable default adapter
     * first.
     * @public
     * @method  BluetoothManager#safelyStartLeScan
     * @param {Array} uuids - scan LE devices which is in uuids. Or give `[]` to
     *                      scan all LE devices.
     * @return {Promise}
     */
    safelyStartLeScan: function bm_safelyStartLeScan(uuids) {
      uuids = uuids || [];
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(
          this._startLeScan, this, [uuids]);
      }
      // TODO: should invoke stopLeScan before startLeScan
      return this._startLeScan(uuids);
    },

    /**
     * Stop LE scan safely.
     * @public
     * @method  BluetoothManager#safelyStopLeScan
     * @return {Promise}
     */
    safelyStopLeScan: function bm_safelyStopLeScan() {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(this._stopLeScan, this);
      }
      return this._stopLeScan().catch(function(reason) {
        console.warn('failed to stop le scan: ' + reason);
      });
    },

    /**
     * Pair device with specific address. No need to worry about whether default
     * adpater is ready or not.
     * @public
     * @method  BluetoothManager#safelyPair
     * @param  {String} address - the address of the device we are going to pair
     * @return {Promise}
     */
    safelyPair: function bm_safelyPair(address) {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(this._pair, this, [address]);
      }
      return this._pair(address);
    },

    /**
     * Unpair device with specific address. No need to worry about whether
     * default adpater is ready or not.
     * @public
     * @method  BluetoothManager#safelyUnpair
     * @param  {String} address - the address of the device we are going to pair
     * @return {Promise}
     */
    safelyUnpair: function bm_safelyUnpair(address) {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(this._unpair, this, [address]);
      }
      return this._unpair(address).catch(function(reason) {
        console.warn('failed to unpair: ' + reason);
      });
    },

    /**
     * Set discoverable. No need to worry about whether default adpater is
     * ready or not.
     * @public
     * @method  BluetoothManager#safelySetDiscoverable
     * @param  {Boolean} value - discoverable or not
     * @return {Promise}
     */
    safelySetDiscoverable: function bm_safelySetDiscoverable(value) {
      if (!this._defaultAdapter) {
        return this._waitForAdapterReadyThen(
          this._setDiscoverable, this, [value]);
      }
      return this._setDiscoverable(value);
    },

    /**
     * Connect BLE device with specific address using BLE Server API.
     * @public
     * @method  BluetoothManager#gattServerConnect
     * @param  {String} address - the address of the device we are going to
     *                          connect
     * @return {Promise}
     */
    gattServerConnect: function bm_gattServerConnect(address) {
      return this._gattServerManager.connect(address);
    },

    /**
     * Disconnect BLE device with specific address using BLE Server API.
     * @public
     * @method  BluetoothManager#gattServerDisconnect
     * @param  {String} address - the address of the device we are going to
     *                          disconnect
     * @return {Promise}
     */
    gattServerDisconnect: function bm_gattServerDisconnect(address) {
      return this._gattServerManager.disconnect(address);
    }
  });

  exports.BluetoothManager = BluetoothManager;
}(window));
