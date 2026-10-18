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

    // --- Typed (msg) input tests ---

    it('should resolve device, cluster, attr from msg and write msg.payload', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'dynamic-write',
              controller: 'c1',
              device: 'device', deviceType: 'msg',
              cluster: 'cluster', clusterType: 'msg',
              attr: 'attr', attrType: 'msg',
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

    it('should ignore msg properties when fields are literal selections', function (done) {
        var flow = [
            { id: 'n1', type: 'matterwriteattr', name: 'static-wins',
              controller: 'c1',
              device: '1234-1', deviceType: 'matterDevice',
              cluster: '6', clusterType: 'matterCluster',
              attr: 'onOff', attrType: 'matterAttr',
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
            var connectNode = sinon.stub().resolves(
                mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) })
            );
            c1.commissioningController = mocks.mockCommissioningController({ connectNode: connectNode });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    // literal device/attr win over msg: onOff setter on device 1234
                    connectNode.firstCall.args[0].toString().should.equal('1234');
                    setOnOff.calledOnce.should.be.true();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            // msg.device/attr must be ignored because the fields are literal selections
            n1.receive({ device: '9999-2', cluster: 513, attr: 'systemMode', payload: 42 });
        });
    });
});
