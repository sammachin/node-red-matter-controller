var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var writeAttrNode = require('../write_attribute.js');
var mockController = require('./_mock_controller');
var mocks = require('./_helpers');

helper.init(require.resolve('node-red'));

describe('matterwriteattr node', function () {
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
            { id: 'n1', type: 'matterwriteattr', name: 'test-write',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff',
              data: 'true', dataType: 'str' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, writeAttrNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.should.have.property('name', 'test-write');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should error on input when device is __SELECT__ and msg.device missing', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'test-write',
              controller: 'c1', device: '__SELECT__', cluster: '6', attr: 'onOff',
              data: 'true', dataType: 'str' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, writeAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            c1.commissioningController = mocks.mockCommissioningController();
            var n1 = helper.getNode('n1');
            n1.receive({ payload: 'true' });
            n1.on('call:error', function (call) {
                try {
                    call.args[0].should.match(/Device not configured/);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    it('should error when controller is not available on input', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'test-write',
              controller: 'missing', device: '1234-1', cluster: '6', attr: 'onOff',
              data: 'true', dataType: 'str' }
        ];
        helper.load(writeAttrNode, flow, function () {
            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
            n1.on('call:error', function (call) {
                try {
                    call.args[0].should.match(/Matter controller not available/);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    it('should write attribute and send ok', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'test-write',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff',
              data: 'true', dataType: 'str', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, writeAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            var setOnOff = sinon.stub().resolves('done');
            var clc = mocks.mockClusterClient({
                setOnOffAttribute: setOnOff
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    setOnOff.calledOnce.should.be.true();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should write null when dataType is null', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'test-write',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff',
              data: '', dataType: 'null', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, writeAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            var setOnOff = sinon.stub().resolves('done');
            var clc = mocks.mockClusterClient({
                setOnOffAttribute: setOnOff
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    setOnOff.calledOnce.should.be.true();
                    should(setOnOff.firstCall.args[0]).be.null();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    // --- Dynamic msg input tests ---

    it('should use msg.device, msg.cluster, msg.attr, msg.payload when config is blank', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'dynamic-write',
              controller: 'c1', device: '', cluster: '', attr: '',
              data: '', dataType: '', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, writeAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            var setSystemModeAttribute = sinon.stub().resolves('done');
            var clc = mocks.mockClusterClient({
                setSystemModeAttribute: setSystemModeAttribute
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    setSystemModeAttribute.calledOnce.should.be.true();
                    setSystemModeAttribute.firstCall.args[0].should.equal(1);
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ device: '1234-1', cluster: 513, attr: 'systemMode', payload: 1 });
        });
    });

    it('should prefer static config over msg properties', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'static-wins',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff',
              data: '', dataType: '', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, writeAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            var setOnOff = sinon.stub().resolves('done');
            var clc = mocks.mockClusterClient({
                setOnOffAttribute: setOnOff
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    // Should have used static config attr 'onOff', not msg.attr 'systemMode'
                    setOnOff.calledOnce.should.be.true();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            // msg.attr should be ignored because config.attr is set
            n1.receive({ device: '9999-2', cluster: 513, attr: 'systemMode', payload: 42 });
        });
    });
});
