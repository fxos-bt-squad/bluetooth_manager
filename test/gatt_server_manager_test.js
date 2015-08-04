/* globals describe, before, after, evt, GattServerManager, it, sinon */
'use strict';

describe('GattServerManager', function() {
  describe('when receives "default-adapter-ready" event', function() {
    var mockBluetoothManager;
    var target;
    before(function() {
      mockBluetoothManager = evt(sinon.stub());

      target = new GattServerManager();
      sinon.spy(target, 'onDefaultAdapterReady');
      target.init(mockBluetoothManager);
    });

    after(function() {
      target.onDefaultAdapterReady.restore();
      target.uninit();
      target = undefined;
    });

    it('should get default adapter and attach event listeners on it',
      function() {
        mockBluetoothManager.fire('default-adapter-ready', {
          adapter: {}
        });
        target.onDefaultAdapterReady.calledOnce.should.be.true();
      });
  });
});