var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var readAttrNode = require('../read_attribute.js');
var mockController = require('./_mock_controller');
var mocks = require('./_helpers');

helper.init(require.resolve('node-red'));

describe('matterreadattr node', function () {
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
            { id: 'n1', type: 'matterreadattr', name: 'test-read',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, readAttrNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.should.have.property('name', 'test-read');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should error on input when device is __SELECT__ and msg.device missing', function (done) {
        var flow = [
            { id: 'n1', type: 'matterreadattr', name: 'test-read',
              controller: 'c1', device: '__SELECT__', cluster: '6', attr: 'onOff' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, readAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            c1.commissioningController = mocks.mockCommissioningController();
            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
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
            { id: 'n1', type: 'matterreadattr', name: 'test-read',
              controller: 'missing', device: '1234-1', cluster: '6', attr: 'onOff' }
        ];
        helper.load(readAttrNode, flow, function () {
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

    it('should read attribute and output the value', function (done) {
        var flow = [
            { id: 'n1', type: 'matterreadattr', name: 'test-read',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'onOff',
              wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, readAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            var clc = mocks.mockClusterClient({
                getOnOffAttribute: sinon.stub().resolves(true)
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', true);
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should error when attribute getter is not found', function (done) {
        var flow = [
            { id: 'n1', type: 'matterreadattr', name: 'test-read',
              controller: 'c1', device: '1234-1', cluster: '6', attr: 'bogusAttr' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, readAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            var clc = mocks.mockClusterClient();
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
            n1.on('call:error', function (call) {
                try {
                    call.args[0].should.match(/not found on cluster/);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    // --- Dynamic msg input tests ---

    it('should use msg.device, msg.cluster, msg.attr when config is blank', function (done) {
        var flow = [
            { id: 'n1', type: 'matterreadattr', name: 'dynamic-read',
              controller: 'c1', device: '', cluster: '', attr: '',
              wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, readAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            var clc = mocks.mockClusterClient({
                getOnOffAttribute: sinon.stub().resolves(true)
            });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', true);
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ device: '1234-1', cluster: 6, attr: 'onOff' });
        });
    });

    it('should error when msg.attr is also missing', function (done) {
        var flow = [
            { id: 'n1', type: 'matterreadattr', name: 'dynamic-read',
              controller: 'c1', device: '', cluster: '', attr: '' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, readAttrNode], flow, function () {
            var c1 = helper.getNode('c1');
            c1.commissioningController = mocks.mockCommissioningController();
            var n1 = helper.getNode('n1');
            n1.receive({ device: '1234-1', cluster: 6 });
            n1.on('call:error', function (call) {
                try {
                    call.args[0].should.match(/Attribute not configured/);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });
});
