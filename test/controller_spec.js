var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var proxyquire = require('proxyquire').noCallThru();

// Stub CommissioningController so the real SDK doesn't try to start
var mockStart = sinon.stub().resolves();
var mockClose = sinon.stub().resolves();
function FakeCommissioningController(opts) {
    this.opts = opts;
    this.start = mockStart;
    this.close = mockClose;
}

var controllerNode = proxyquire('../controller.js', {
    '@project-chip/matter.js': {
        CommissioningController: FakeCommissioningController,
        '@noCallThru': true
    }
});

helper.init(require.resolve('node-red'));

describe('mattercontroller node', function () {
    this.timeout(10000);

    beforeEach(function (done) {
        mockStart.resetHistory();
        mockClose.resetHistory();
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    it('should load with correct defaults', function (done) {
        var flow = [
            { id: 'c1', type: 'mattercontroller', name: 'Test Ctrl',
              networkInterface: 'eth0', storageLocation: '/tmp/.matter-test' }
        ];
        helper.load(controllerNode, flow, function () {
            var c1 = helper.getNode('c1');
            try {
                c1.should.have.property('name', 'Test Ctrl');
                c1.should.have.property('networkInterface', 'eth0');
                c1.should.have.property('storageLocation', '/tmp/.matter-test');
                c1.should.have.property('commissioningController');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should use fabricLabel from config', function (done) {
        var flow = [
            { id: 'c1', type: 'mattercontroller', name: 'Ctrl',
              fabricLabel: 'My Fabric', networkInterface: 'eth0',
              storageLocation: '/tmp/.matter-test' }
        ];
        helper.load(controllerNode, flow, function () {
            var c1 = helper.getNode('c1');
            try {
                c1.fabricLabel.should.equal('My Fabric');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should fall back fabricLabel to name when not set', function (done) {
        var flow = [
            { id: 'c1', type: 'mattercontroller', name: 'FallbackName',
              networkInterface: 'eth0', storageLocation: '/tmp/.matter-test' }
        ];
        helper.load(controllerNode, flow, function () {
            var c1 = helper.getNode('c1');
            try {
                c1.fabricLabel.should.equal('FallbackName');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should fall back fabricLabel to default when name is also empty', function (done) {
        var flow = [
            { id: 'c1', type: 'mattercontroller', name: '',
              networkInterface: 'eth0', storageLocation: '/tmp/.matter-test' }
        ];
        helper.load(controllerNode, flow, function () {
            var c1 = helper.getNode('c1');
            try {
                c1.fabricLabel.should.equal('Node-RED Matter Controller');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should call CommissioningController.start()', function (done) {
        var flow = [
            { id: 'c1', type: 'mattercontroller', name: 'Test',
              networkInterface: 'eth0', storageLocation: '/tmp/.matter-test' }
        ];
        helper.load(controllerNode, flow, function () {
            try {
                mockStart.calledOnce.should.be.true();
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should pass autoConnect: false to CommissioningController', function (done) {
        var flow = [
            { id: 'c1', type: 'mattercontroller', name: 'Test',
              networkInterface: 'eth0', storageLocation: '/tmp/.matter-test' }
        ];
        helper.load(controllerNode, flow, function () {
            var c1 = helper.getNode('c1');
            try {
                c1.commissioningController.opts.should.have.property('autoConnect', false);
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should call close on the commissioningController when node closes', function (done) {
        var flow = [
            { id: 'c1', type: 'mattercontroller', name: 'Test',
              networkInterface: 'eth0', storageLocation: '/tmp/.matter-test' }
        ];
        helper.load(controllerNode, flow, function () {
            // unload triggers the close handler
            helper.unload().then(function () {
                try {
                    mockClose.calledOnce.should.be.true();
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });
});
