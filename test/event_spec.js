var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var eventNode = require('../event.js');
var mockController = require('./_mock_controller');
var mocks = require('./_helpers');

helper.init(require.resolve('node-red'));

describe('matterevent node', function () {
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
            { id: 'n1', type: 'matterevent', name: 'test-evt',
              controller: 'c1', device: '1234-1', cluster: '6',
              event: 'stateChange', topic: 'evt' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, eventNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.should.have.property('name', 'test-evt');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should error and show status when controller is missing', function (done) {
        var flow = [
            { id: 'n1', type: 'matterevent', name: 'test-evt',
              controller: 'missing', device: '1234-1', cluster: '6',
              event: 'stateChange', topic: 'evt' }
        ];
        helper.load(eventNode, flow, function () {
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
            { id: 'n1', type: 'matterevent', name: 'test-evt',
              controller: 'c1', device: '__SELECT__', cluster: '6',
              event: 'stateChange', topic: 'evt' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, eventNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.status.should.be.calledWithMatch({ fill: 'yellow', text: 'not configured' });
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should subscribe to event when controller starts', function (done) {
        var flow = [
            { id: 'n1', type: 'matterevent', name: 'test-evt',
              controller: 'c1', device: '1234-1', cluster: '6',
              event: 'stateChange', topic: 'evt', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, eventNode], flow, function () {
            var c1 = helper.getNode('c1');
            var addListener = sinon.stub();
            var clc = mocks.mockClusterClient({
                addStateChangeEventListener: addListener
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });
            c1.started = true;

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

    it('should emit messages when the event fires', function (done) {
        var flow = [
            { id: 'n1', type: 'matterevent', name: 'test-evt',
              controller: 'c1', device: '1234-1', cluster: '6',
              event: 'stateChange', topic: 'my-topic', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, eventNode], flow, function () {
            var c1 = helper.getNode('c1');
            var capturedCallback;
            var addListener = sinon.stub().callsFake(function (cb) {
                capturedCallback = cb;
            });
            var clc = mocks.mockClusterClient({
                addStateChangeEventListener: addListener
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
                    msg.should.have.property('topic', 'my-topic');
                    msg.should.have.property('payload').deepEqual({ state: 'on' });
                    done();
                } catch (err) {
                    done(err);
                }
            });

            setTimeout(function () {
                if (capturedCallback) {
                    capturedCallback({ state: 'on' });
                }
            }, 500);
        });
    });
});
