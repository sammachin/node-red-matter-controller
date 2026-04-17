var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var managerNode = require('../manager.js');
var mockController = require('./_mock_controller');
var mocks = require('./_helpers');

helper.init(require.resolve('node-red'));

describe('mattermanager node', function () {
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
            { id: 'n1', type: 'mattermanager', name: 'test-mgr',
              controller: 'c1', method: 'listDevices', methodType: 'str',
              code: '', codeType: 'str', deviceid: '', deviceidType: 'str',
              label: '', labelType: 'str' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, managerNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.should.have.property('name', 'test-mgr');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should error when controller is not available on input', function (done) {
        var flow = [
            { id: 'n1', type: 'mattermanager', name: 'test-mgr',
              controller: 'missing', method: 'listDevices', methodType: 'str',
              code: '', codeType: 'str', deviceid: '', deviceidType: 'str',
              label: '', labelType: 'str' }
        ];
        helper.load(managerNode, flow, function () {
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

    it('should list commissioned devices', function (done) {
        var flow = [
            { id: 'n1', type: 'mattermanager', name: 'test-mgr',
              controller: 'c1', method: 'listDevices', methodType: 'str',
              code: '', codeType: 'str', deviceid: '', deviceidType: 'str',
              label: '', labelType: 'str', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, managerNode], flow, function () {
            var c1 = helper.getNode('c1');
            var nodeIds = [BigInt(1001), BigInt(1002)];
            c1.commissioningController = mocks.mockCommissioningController({
                getCommissionedNodes: sinon.stub().returns(nodeIds)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.payload.should.deepEqual(nodeIds);
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should get device info', function (done) {
        var flow = [
            { id: 'n1', type: 'mattermanager', name: 'test-mgr',
              controller: 'c1', method: 'getDevice', methodType: 'str',
              code: '', codeType: 'str', deviceid: '1234-1', deviceidType: 'str',
              label: '', labelType: 'str', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, managerNode], flow, function () {
            var c1 = helper.getNode('c1');
            var info = mocks.mockBasicInfo();
            var conn = mocks.mockConnection({
                getRootClusterClient: sinon.stub().returns(info)
            });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.payload.should.have.property('label', 'Test Device');
                    msg.payload.should.have.property('productName', 'Test Product');
                    msg.payload.should.have.property('vendorName', 'Test Vendor');
                    msg.payload.should.have.property('serialNumber', 'SN12345');
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should list endpoints for a device', function (done) {
        var flow = [
            { id: 'n1', type: 'mattermanager', name: 'test-mgr',
              controller: 'c1', method: 'listEndpoints', methodType: 'str',
              code: '', codeType: 'str', deviceid: '1234-1', deviceidType: 'str',
              label: '', labelType: 'str', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, managerNode], flow, function () {
            var c1 = helper.getNode('c1');
            var ep = mocks.mockEndpoint(mocks.mockClusterClient());
            var conn = mocks.mockConnection({
                getDevices: sinon.stub().returns([ep])
            });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.payload.should.be.an.Array().with.length(1);
                    msg.payload[0].should.have.property('endpoint', 1);
                    msg.payload[0].should.have.property('clusters').which.is.an.Array();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should describe a device', function (done) {
        var flow = [
            { id: 'n1', type: 'mattermanager', name: 'test-mgr',
              controller: 'c1', method: 'describe', methodType: 'str',
              code: '', codeType: 'str', deviceid: '1234-1', deviceidType: 'str',
              label: '', labelType: 'str', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, managerNode], flow, function () {
            var c1 = helper.getNode('c1');
            var clc = mocks.mockClusterClient();
            var ep = mocks.mockEndpoint(clc, {
                getAllClusterClients: sinon.stub().returns([{
                    id: 6, name: 'OnOff',
                    attributes: { onOff: {} },
                    commands: { toggle: function () {} }
                }])
            });
            var conn = mocks.mockConnection({
                getDevices: sinon.stub().returns([ep])
            });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.payload.should.be.an.Array().with.length(1);
                    msg.payload[0].clusters[0].should.have.property('attributes');
                    msg.payload[0].clusters[0].should.have.property('commands');
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should error on unknown method', function (done) {
        var flow = [
            { id: 'n1', type: 'mattermanager', name: 'test-mgr',
              controller: 'c1', method: 'unknownMethod', methodType: 'str',
              code: '', codeType: 'str', deviceid: '1234-1', deviceidType: 'str',
              label: '', labelType: 'str' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, managerNode], flow, function () {
            var c1 = helper.getNode('c1');
            c1.commissioningController = mocks.mockCommissioningController();

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
            n1.on('call:error', function (call) {
                try {
                    call.args[0].should.match(/Unknown Method/);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });
});
