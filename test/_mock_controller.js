/**
 * Mock controller node for testing.
 *
 * Registers a minimal "mattercontroller" config node type so that
 * action nodes can call RED.nodes.getNode(config.controller) and
 * receive a real node object.  Tests can then attach a stubbed
 * commissioningController to the node instance after helper.load().
 */
module.exports = function (RED) {
    function MockMatterController(config) {
        RED.nodes.createNode(this, config);
        this.started = false;
        this.commissioningController = null;
        this.networkInterface = config.networkInterface || 'eth0';
        this.storageLocation = config.storageLocation || '/tmp/.matter-test';
        this.fabricLabel = config.fabricLabel || config.name || 'Test Controller';
    }
    RED.nodes.registerType('mattercontroller', MockMatterController);
};
