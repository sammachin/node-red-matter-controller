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
        const self = this;
        this.started = false;
        this.commissioningController = null;
        this.networkInterface = config.networkInterface || 'eth0';
        this.storageLocation = config.storageLocation || '/tmp/.matter-test';
        this.fabricLabel = config.fabricLabel || config.name || 'Test Controller';

        // Mirror the real controller's shared-connection and start helpers so the
        // action nodes exercise the same code paths under test.
        this._connections = new Map();
        this._waitTimers = new Set();

        this.getConnection = function (id) {
            const key = String(id);
            let p = self._connections.get(key);
            if (!p) {
                p = self.commissioningController.connectNode(id)
                    .catch(function (err) {
                        self._connections.delete(key);
                        throw err;
                    });
                self._connections.set(key, p);
            }
            return p;
        };

        this.whenStarted = function (timeoutMs) {
            if (timeoutMs === undefined) { timeoutMs = 30000; }
            if (self.started) { return Promise.resolve(); }
            return new Promise(function (resolve, reject) {
                const start = Date.now();
                const check = function () {
                    if (self.started) { return resolve(); }
                    if (Date.now() - start >= timeoutMs) {
                        return reject(new Error('Matter controller did not start in time'));
                    }
                    const t = setTimeout(function () { self._waitTimers.delete(t); check(); }, 100);
                    self._waitTimers.add(t);
                };
                check();
            });
        };
    }
    RED.nodes.registerType('mattercontroller', MockMatterController);
};
