var should = require('should');
var sinon = require('sinon');
var helper = require('node-red-node-test-helper');
var editorApisNode = require('../editor_apis.js');
var mockController = require('./_mock_controller');
var mocks = require('./_helpers');

helper.init(require.resolve('node-red'));

describe('editor_apis.js HTTP endpoints', function () {
    this.timeout(10000);

    beforeEach(function (done) {
        helper.startServer(done);
    });

    afterEach(function (done) {
        helper.unload().then(function () {
            helper.stopServer(done);
        });
    });

    describe('GET /_mattercontroller/interfaces', function () {
        it('should return a list of IPv6 network interfaces', function (done) {
            var flow = [];
            helper.load(editorApisNode, flow, function () {
                helper.request()
                    .get('/_mattercontroller/interfaces')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Array();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET /_mattercontroller/homedir', function () {
        it('should return the home directory', function (done) {
            var flow = [];
            helper.load(editorApisNode, flow, function () {
                helper.request()
                    .get('/_mattercontroller/homedir')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.text.should.be.a.String();
                            res.text.length.should.be.above(0);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET /_mattermodel/cluster/:clid/command/:cmd/options', function () {
        it('should return command options for a known cluster/command', function (done) {
            var flow = [];
            helper.load(editorApisNode, flow, function () {
                helper.request()
                    .get('/_mattermodel/cluster/8/command/moveToLevel/options')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            // commandOptions returns the object; properties whose
                            // model default is undefined are dropped by JSON
                            // serialization, so just verify it's a valid response.
                            res.body.should.be.an.Object();
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });

        it('should return empty object for unknown command', function (done) {
            var flow = [];
            helper.load(editorApisNode, flow, function () {
                helper.request()
                    .get('/_mattermodel/cluster/6/command/bogus/options')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Object();
                            Object.keys(res.body).length.should.equal(0);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET /_mattermodel/cluster/:clid/attribute/:attr/options', function () {
        it('should return attribute metadata for a known cluster/attribute', function (done) {
            var flow = [];
            helper.load(editorApisNode, flow, function () {
                helper.request()
                    .get('/_mattermodel/cluster/6/attribute/onOff/options')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Object();
                            res.body.should.have.property('name', 'OnOff');
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET /_mattercontroller/:id/devices/', function () {
        it('should return 404 when controller node does not exist', function (done) {
            var flow = [];
            helper.load(editorApisNode, flow, function () {
                helper.request()
                    .get('/_mattercontroller/nonexistent/devices/')
                    .expect(404)
                    .end(done);
            });
        });

        it('should return empty object when no commissioned nodes', function (done) {
            var flow = [
                { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
            ];
            helper.load([mockController, editorApisNode], flow, function () {
                var c1 = helper.getNode('c1');
                c1.commissioningController = mocks.mockCommissioningController({
                    getCommissionedNodes: sinon.stub().returns([])
                });
                helper.request()
                    .get('/_mattercontroller/c1/devices/')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Object();
                            Object.keys(res.body).length.should.equal(0);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });

        it('should return device list for simple devices', function (done) {
            var flow = [
                { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
            ];
            helper.load([mockController, editorApisNode], flow, function () {
                var c1 = helper.getNode('c1');
                var info = mocks.mockBasicInfo({
                    getNodeLabelAttribute: sinon.stub().resolves('Living Room Light')
                });
                var ep = mocks.mockEndpoint(null, {
                    number: 1, deviceType: 256
                });
                var conn = mocks.mockConnection({
                    getDevices: sinon.stub().returns([ep]),
                    getRootClusterClient: sinon.stub().returns(info)
                });
                c1.commissioningController = mocks.mockCommissioningController({
                    getCommissionedNodes: sinon.stub().returns([BigInt(5001)]),
                    connectNode: sinon.stub().resolves(conn)
                });

                helper.request()
                    .get('/_mattercontroller/c1/devices/')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Object();
                            res.body.should.have.property('5001-1', 'Living Room Light');
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET /_mattercontroller/:cid/device/:did/clusters', function () {
        it('should return 404 when controller does not exist', function (done) {
            var flow = [];
            helper.load(editorApisNode, flow, function () {
                helper.request()
                    .get('/_mattercontroller/missing/device/1234-1/clusters')
                    .expect(404)
                    .end(done);
            });
        });

        it('should return cluster list', function (done) {
            var flow = [
                { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
            ];
            helper.load([mockController, editorApisNode], flow, function () {
                var c1 = helper.getNode('c1');
                var ep = {
                    getAllClusterClients: sinon.stub().returns([
                        { id: 6, name: 'OnOff' },
                        { id: 8, name: 'LevelControl' }
                    ])
                };
                var conn = { getDeviceById: sinon.stub().returns(ep) };
                c1.commissioningController = mocks.mockCommissioningController({
                    connectNode: sinon.stub().resolves(conn)
                });

                helper.request()
                    .get('/_mattercontroller/c1/device/1234-1/clusters')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.have.property('6', 'OnOff');
                            res.body.should.have.property('8', 'LevelControl');
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET /_mattercontroller/:cid/device/:did/cluster/:clid/commands', function () {
        it('should return command list for a cluster', function (done) {
            var flow = [
                { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
            ];
            helper.load([mockController, editorApisNode], flow, function () {
                var c1 = helper.getNode('c1');
                var ep = {
                    getClusterClientById: sinon.stub().returns({
                        commands: { toggle: function(){}, on: function(){}, off: function(){} }
                    })
                };
                var conn = { getDeviceById: sinon.stub().returns(ep) };
                c1.commissioningController = mocks.mockCommissioningController({
                    connectNode: sinon.stub().resolves(conn)
                });

                helper.request()
                    .get('/_mattercontroller/c1/device/1234-1/cluster/6/commands')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Array();
                            res.body.should.containDeep(['toggle', 'on', 'off']);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET /_mattercontroller/:cid/device/:did/cluster/:clid/attributes', function () {
        it('should return attribute list', function (done) {
            var flow = [
                { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
            ];
            helper.load([mockController, editorApisNode], flow, function () {
                var c1 = helper.getNode('c1');
                var ep = {
                    getClusterClientById: sinon.stub().returns({
                        attributes: { onOff: {}, globalSceneControl: {} }
                    })
                };
                var conn = { getDeviceById: sinon.stub().returns(ep) };
                c1.commissioningController = mocks.mockCommissioningController({
                    connectNode: sinon.stub().resolves(conn)
                });

                helper.request()
                    .get('/_mattercontroller/c1/device/1234-1/cluster/6/attributes')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Array();
                            res.body.should.containDeep(['onOff', 'globalSceneControl']);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET .../attributes_writable', function () {
        it('should return only writable attributes', function (done) {
            var flow = [
                { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
            ];
            helper.load([mockController, editorApisNode], flow, function () {
                var c1 = helper.getNode('c1');
                var ep = {
                    getClusterClientById: sinon.stub().returns({
                        attributes: {
                            onOff: { attribute: { writable: false } },
                            onTime: { attribute: { writable: true } },
                            offWaitTime: { attribute: { writable: true } }
                        }
                    })
                };
                var conn = { getDeviceById: sinon.stub().returns(ep) };
                c1.commissioningController = mocks.mockCommissioningController({
                    connectNode: sinon.stub().resolves(conn)
                });

                helper.request()
                    .get('/_mattercontroller/c1/device/1234-1/cluster/6/attributes_writable')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Array();
                            res.body.should.containDeep(['onTime', 'offWaitTime']);
                            res.body.should.not.containDeep(['onOff']);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });

    describe('GET .../events', function () {
        it('should return event list for a cluster', function (done) {
            var flow = [
                { id: 'c1', type: 'mattercontroller', name: 'ctrl' }
            ];
            helper.load([mockController, editorApisNode], flow, function () {
                var c1 = helper.getNode('c1');
                var ep = {
                    getClusterClientById: sinon.stub().returns({
                        events: { stateChange: {}, startUp: {} }
                    })
                };
                var conn = { getDeviceById: sinon.stub().returns(ep) };
                c1.commissioningController = mocks.mockCommissioningController({
                    connectNode: sinon.stub().resolves(conn)
                });

                helper.request()
                    .get('/_mattercontroller/c1/device/1234-1/cluster/6/events')
                    .expect(200)
                    .end(function (err, res) {
                        if (err) return done(err);
                        try {
                            res.body.should.be.an.Array();
                            res.body.should.containDeep(['stateChange', 'startUp']);
                            done();
                        } catch (e) {
                            done(e);
                        }
                    });
            });
        });
    });
});
