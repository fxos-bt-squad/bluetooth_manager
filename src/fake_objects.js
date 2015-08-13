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
  exports.FakeGattServer = FakeGattServer;

  var FakeGattService = function(isPrimary, uuid) {
    this.characteristics = [];
    this.includedServices = [];
    this.isPrimary = isPrimary || false;
    this.uuid = uuid || '';
    this.instanceId = 0;
  };
  FakeGattService.prototype = {
    addCharateristic: function(uuid, permissions, properties, value) {
      var that = this;
      return new Promise(function(resolve, reject) {
        var characteristic = new FakeGattCharacteristic();

        characteristic._service = that;
        characteristic._descriptors = [];
        characteristic._uuid = uuid;
        characteristic._instanceId = 0;
        characteristic._value = value;
        characteristic._permissions = permissions;
        characteristic._properties = properties;
        characteristic.writeType = {
          noResponse: false,
          'default': false,
          signed: false
        };

        that.characteristics.push(characteristic);
        resolve(characteristic);
      });
    },
    addIncludedService: function(service) {
      return Promise.resolve();
    }
  };
  exports.FakeGattService = FakeGattService;

  // do not call this ctor from external module
  var FakeGattCharacteristic = function() {};
  FakeGattCharacteristic.prototype = {
    get service () {
      return this._service;
    },
    get descriptors () {
      return this._descriptors;
    },
    get uuid () {
      return this._uuid;
    },
    get instanceId () {
      return this._instanceId;
    },
    get value () {
      return this._value;
    },
    get permissions () {
      return this._permissions;
    },
    get properties () {
      return this._properties;
    },
    // TODO: writeType
    readValue: function() {
      return Promise.resolve();
    },
    writeValue: function(value) {
      return Promise.resolve();
    },
    startNotifications: function() {
      return Promise.resolve();
    },
    stopNotifications: function() {
      return Promise.resolve();
    },
    addDescriptor: function(uuid, permissions, value) {
      return Promise.resolve();
    }
  };
  exports.FakeGattCharacteristic = FakeGattCharacteristic;

  var FakeGattDescriptor = function(uuid, permissions, value, characteristic) {
    this.characteristic = characteristic;
    this.uuid = uuid;
    this.permissions = permissions;
    this.value = value;
  };
  FakeGattDescriptor.prototype = {
    readValue: function() {
      return Promise.resolve(this.value);
    },
    writeValue: function(value) {
      this.value = value;
      return Promise.resolve();
    }
  };
  exports.FakeGattDescriptor = FakeGattDescriptor;

}(window));