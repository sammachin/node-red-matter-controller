const { Environment, Logger, StorageService } = require("@matter/main");
const { CommissioningController } = require("@project-chip/matter.js")

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
        node.networkInterface = config.networkInterface 
        node.storageLocation = config.storageLocation
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


