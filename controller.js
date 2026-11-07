const { Environment, Logger, StorageService } = require("@matter/main");
const { CommissioningController } = require("@project-chip/matter.js");
require('@matter/nodejs-ble');

const environment = Environment.default;

// The Matter SDK can throw unhandled errors from internal UDP/CASE
// sessions during close/redeploy (e.g. "Not running" from dgram,
// or CASE Sigma2 errors during session resumption).
// These bubble up as uncaught exceptions or unhandled promise rejections
// because they originate inside the SDK's network/session layer.
// Catch them here so they don't crash Node-RED.
let _matterExceptionHandler = null
let _matterRejectionHandler = null

module.exports =  function(RED) {
    function MatterController(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.started = false
        // Shared, de-duplicated connections keyed by node id. A Matter node may
        // expose several endpoints, so multiple runtime nodes (subscribe/event/
        // command/read/write) can target the same node id. connectNode() must be
        // called once per node id and the resulting PairedNode reused — calling it
        // concurrently for the same id makes matter.js throw
        // "PairedNode unavailable due to initialization error" on the loser of the race.
        node._connections = new Map()
        node._waitTimers = new Set()

        // Return a cached Promise<PairedNode> for a node id, connecting once and
        // sharing that connection with every caller. A failed connect is evicted
        // so a later call can retry.
        node.getConnection = function(id) {
            const key = String(id)
            let p = node._connections.get(key)
            if (!p) {
                p = node.commissioningController.connectNode(id)
                    .catch((err) => {
                        node._connections.delete(key)
                        throw err
                    })
                node._connections.set(key, p)
            }
            return p
        }

        // Resolve once the controller has finished starting (CommissioningController
        // .start() has completed). Lets input-driven nodes wait instead of throwing
        // "Controller instance not yet started" when triggered during startup.
        node.whenStarted = function(timeoutMs = 30000) {
            if (node.started) return Promise.resolve()
            return new Promise((resolve, reject) => {
                const start = Date.now()
                const check = () => {
                    if (node.started) return resolve()
                    if (Date.now() - start >= timeoutMs) {
                        return reject(new Error('Matter controller did not start in time'))
                    }
                    const t = setTimeout(() => { node._waitTimers.delete(t); check() }, 100)
                    node._waitTimers.add(t)
                }
                check()
            })
        }
        node.networkInterface = config.networkInterface
        node.storageLocation = config.storageLocation
        node.threadName = config.threadName
        node.tlvs = config.tlvs
        node.wifiSsid = config.wifiSsid
        node.wifiCredentials = config.wifiCredentials
        node.countryCode = config.countryCode || "XX"
        node.fabricLabel = config.fabricLabel || config.name || 'Node-RED Matter Controller'
        switch (config.logLevel) {
            case "FATAL":
                Logger.defaultLogLevel = 5;
                break;
            case "ERROR":
                Logger.defaultLogLevel = 4;
                break;
            case "WARN":
                Logger.defaultLogLevel = 3;
                break;
            case "INFO":
                Logger.defaultLogLevel = 1;
                break;
            case "DEBUG":
                Logger.defaultLogLevel = 0;
                break;
        }
        Environment.default.vars.set('mdns.networkInterface', node.networkInterface);
        Environment.default.vars.set('ble.enable', true);
        let ss = environment.get(StorageService);
        if (node.storageLocation){
            ss.location = node.storageLocation;
            environment.set(StorageService, ss)
            node.log(`Using Custom Storage Location: ${ss.location}`)
        } else {
            node.log(`Using Default Storage Location: ${ss.location}`)
        }
        node.commissioningController = new CommissioningController({
            environment: {
                environment,
                id: node.id
            },
            autoConnect: false,
            adminFabricLabel: node.fabricLabel,
        })

        if (!_matterExceptionHandler) {
            _matterExceptionHandler = function(err) {
                if (err && err.stack && (err.stack.includes('@matter/') || err.stack.includes('@project-chip/'))) {
                    node.warn(`Matter SDK error caught (non-fatal): ${err.message}`)
                } else {
                    throw err
                }
            }
            process.on('uncaughtException', _matterExceptionHandler)
        }

        if (!_matterRejectionHandler) {
            _matterRejectionHandler = function(reason) {
                const err = reason instanceof Error ? reason : new Error(String(reason))
                if (err.stack && (err.stack.includes('@matter/') || err.stack.includes('@project-chip/'))) {
                    node.warn(`Matter SDK rejection caught (non-fatal): ${err.message}`)
                } else {
                    node.error(`Unhandled rejection: ${err.message}`)
                }
            }
            process.on('unhandledRejection', _matterRejectionHandler)
        }

        node.commissioningController.start()
            .then(() => {node.started = true})
            .catch((error) => {node.error(`Failed to start Matter controller: ${error.message}`)})

        node.on('close', function(done) {
            node.started = false
            for (const t of node._waitTimers) { clearTimeout(t) }
            node._waitTimers.clear()
            node._connections.clear()
            if (node.commissioningController) {
                node.commissioningController.close()
                    .then(() => done())
                    .catch(() => done())
            } else {
                done()
            }
        })
    }
    RED.nodes.registerType("mattercontroller",MatterController);

    
}


