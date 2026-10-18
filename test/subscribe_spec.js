var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var subscribeNode = require('../subscribe.js');
var mockController = require('./_mock_controller');
var mocks = require('./_helpers');

helper.init(require.resolve('node-red'));

describe('mattersubscribe node', function () {
    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    it('should load and register', function (done) {
        var flow = [
            { id: 'n1', type: 'mattersubscribe', name: 'test-sub',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff', topic: 'test' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, subscribeNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.should.have.property('name', 'test-sub');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should error and show status when controller is missing', function (done) {
        var flow = [
            { id: 'n1', type: 'mattersubscribe', name: 'test-sub',
              controller: 'missing', device: '1234-1', cluster: '6', attr: 'onOff', topic: 'test' }
        ];
        helper.load(subscribeNode, flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.error.should.be.calledOnce();
                n1.error.firstCall.args[0].should.match(/Matter controller not available/);
                n1.status.should.be.calledWithMatch({ fill: 'red', text: 'no controller' });
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should show not-configured status when device is __SELECT__', function (done) {
        var flow = [
            { id: 'n1', type: 'mattersubscribe', name: 'test-sub',
              controller: 'c1', device: '__SELECT__', cluster: '6', attr: 'onOff', topic: 'test' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, subscribeNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.status.should.be.calledWithMatch({ fill: 'yellow', text: 'not configured' });
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should subscribe to attribute when controller starts', function (done) {
        var flow = [
            { id: 'n1', type: 'mattersubscribe', name: 'test-sub',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff',
              topic: 'test-topic', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, subscribeNode], flow, function () {
            var c1 = helper.getNode('c1');
            var addListener = sinon.stub();
            var clc = mocks.mockClusterClient({
                addOnOffAttributeListener: addListener
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            // Simulate the controller becoming ready
            c1.started = true;

            // Wait for the waitforserver polling to pick up started=true
            setTimeout(function () {
                try {
                    addListener.calledOnce.should.be.true();
                    done();
                } catch (err) {
                    done(err);
                }
            }, 500);
        });
    });

    it('should emit messages when the attribute listener fires', function (done) {
        var flow = [
            { id: 'n1', type: 'mattersubscribe', name: 'test-sub',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff',
              topic: 'test-topic', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, subscribeNode], flow, function () {
            var c1 = helper.getNode('c1');
            var capturedCallback;
            var addListener = sinon.stub().callsFake(function (cb) {
                capturedCallback = cb;
            });
            var clc = mocks.mockClusterClient({
                addOnOffAttributeListener: addListener
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });
            c1.started = true;

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('topic', 'test-topic');
                    msg.should.have.property('payload', false);
                    done();
                } catch (err) {
                    done(err);
                }
            });

            // Wait for subscription setup, then trigger
            setTimeout(function () {
                if (capturedCallback) {
                    capturedCallback(false);
                }
            }, 500);
        });
    });
});
