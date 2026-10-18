var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var commandNode = require('../command.js');
var mockController = require('./_mock_controller');
var mocks = require('./_helpers');

helper.init(require.resolve('node-red'));

describe('mattercommand node', function () {
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
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'c1', device: '1234-1', cluster: '6', command: 'toggle',
              data: '{}', dataType: 'json' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, commandNode], flow, function () {
            var n1 = helper.getNode('n1');
            try {
                n1.should.have.property('name', 'test-cmd');
                done();
            } catch (err) {
                done(err);
            }
        });
    });

    it('should error on input when device is __SELECT__ and msg.device is missing', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'c1', device: '__SELECT__', cluster: '6', command: 'toggle',
              data: '{}', dataType: 'json' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, commandNode], flow, function () {
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

    it('should error on input when device is empty and msg.device is missing', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'c1', device: '', cluster: '6', command: 'toggle',
              data: '{}', dataType: 'json' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, commandNode], flow, function () {
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
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'missing', device: '1234-1', cluster: '6', command: 'toggle',
              data: '{}', dataType: 'json' }
        ];
        helper.load(commandNode, flow, function () {
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

    it('should invoke the command and send msg on success', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'c1', device: '1234-1', cluster: '6', command: 'toggle',
              data: '{}', dataType: 'json', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, commandNode], flow, function () {
            var c1 = helper.getNode('c1');
            var clc = mocks.mockClusterClient();
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    clc.commands.toggle.calledOnce.should.be.true();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should invoke command with data when data is non-empty', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'c1', device: '1234-1', cluster: '8', command: 'moveToLevel',
              data: '{"level":100}', dataType: 'json', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, commandNode], flow, function () {
            var c1 = helper.getNode('c1');
            var moveToLevel = sinon.stub().resolves();
            var clc = mocks.mockClusterClient({
                commands: { moveToLevel: moveToLevel }
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
                    moveToLevel.calledOnce.should.be.true();
                    moveToLevel.firstCall.args[0].should.deepEqual({ level: 100 });
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
        });
    });

    it('should error when command is not found on cluster', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'c1', device: '1234-1', cluster: '6', command: 'badCommand',
              data: '{}', dataType: 'json' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, commandNode], flow, function () {
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

    it('should handle connectNode rejection', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'test-cmd',
              controller: 'c1', device: '1234-1', cluster: '6', command: 'toggle',
              data: '{}', dataType: 'json' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, commandNode], flow, function () {
            var c1 = helper.getNode('c1');
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().rejects(new Error('connection failed'))
            });

            var n1 = helper.getNode('n1');
            n1.receive({ payload: {} });
            n1.on('call:error', function (call) {
                try {
                    call.args[0].message.should.match(/connection failed/);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });

    // --- Dynamic msg input tests ---

    it('should use msg.device, msg.cluster, msg.command when config is blank', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'dynamic-cmd',
              controller: 'c1', device: '', cluster: '', command: '',
              data: '', dataType: '', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, commandNode], flow, function () {
            var c1 = helper.getNode('c1');
            var toggle = sinon.stub().resolves();
            var clc = mocks.mockClusterClient({ commands: { toggle: toggle } });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    toggle.calledOnce.should.be.true();
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ device: '1234-1', cluster: 6, command: 'toggle', payload: {} });
        });
    });

    it('should use msg.payload as data when config data/dataType are blank', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'dynamic-cmd',
              controller: 'c1', device: '', cluster: '', command: '',
              data: '', dataType: '', wires: [['out']] },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' },
            { id: 'out', type: 'helper' }
        ];
        helper.load([mockController, commandNode], flow, function () {
            var c1 = helper.getNode('c1');
            var moveToLevel = sinon.stub().resolves();
            var clc = mocks.mockClusterClient({ commands: { moveToLevel: moveToLevel } });
            var ep = mocks.mockEndpoint(clc);
            var conn = mocks.mockConnection({ getDeviceById: sinon.stub().returns(ep) });
            c1.commissioningController = mocks.mockCommissioningController({
                connectNode: sinon.stub().resolves(conn)
            });

            var out = helper.getNode('out');
            out.on('input', function (msg) {
                try {
                    msg.should.have.property('payload', 'ok');
                    moveToLevel.calledOnce.should.be.true();
                    moveToLevel.firstCall.args[0].should.deepEqual({ level: 50 });
                    done();
                } catch (err) {
                    done(err);
                }
            });

            var n1 = helper.getNode('n1');
            n1.receive({ device: '1234-1', cluster: 8, command: 'moveToLevel', payload: { level: 50 } });
        });
    });

    it('should error when msg.cluster is also missing', function (done) {
        var flow = [
            { id: 'n1', type: 'mattercommand', name: 'dynamic-cmd',
              controller: 'c1', device: '', cluster: '', command: '',
              data: '', dataType: '' },
            { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
        ];
        helper.load([mockController, commandNode], flow, function () {
            var c1 = helper.getNode('c1');
            c1.commissioningController = mocks.mockCommissioningController();
            var n1 = helper.getNode('n1');
            n1.receive({ device: '1234-1', payload: {} });
            n1.on('call:error', function (call) {
                try {
                    call.args[0].should.match(/Cluster not configured/);
                    done();
                } catch (err) {
                    done(err);
                }
            });
        });
    });
});
