

module.exports =  function(RED) {
    function MatterCommand(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.controller = RED.nodes.getNode(config.controller);

        // Parse static config if provided; leave undefined for dynamic msg input
        const hasStaticDevice = config.device && config.device !== "__SELECT__"
        if (hasStaticDevice) {
            node._id = BigInt(config.device.split('-')[0])
            node._ep = config.device.split('-')[1] || 1
        }
        const hasStaticCluster = config.cluster && config.cluster !== "__SELECT__"
        if (hasStaticCluster) {
            node.cluster = Number(config.cluster)
        }
        const hasStaticCommand = config.command && config.command !== "__SELECT__"
        if (hasStaticCommand) {
            node.command = config.command
        }

        this.on('input', function(msg, send, done) {
            if (!node.controller || !node.controller.commissioningController) {
                done('Matter controller not available — check that the controller is configured and deployed')
                return
            }

            // Resolve device: static config or msg.device
            let deviceId, ep
            if (hasStaticDevice) {
                deviceId = node._id
                ep = node._ep
            } else if (msg.device && msg.device !== "__SELECT__") {
                deviceId = BigInt(String(msg.device).split('-')[0])
                ep = String(msg.device).split('-')[1] || 1
            } else {
                done('Device not configured — set in editor or pass msg.device')
                return
            }

            // Resolve cluster
            let cluster
            if (hasStaticCluster) {
                cluster = node.cluster
            } else if (msg.cluster != null) {
                cluster = Number(msg.cluster)
            } else {
                done('Cluster not configured — set in editor or pass msg.cluster')
                return
            }

            // Resolve command
            let command
            if (hasStaticCommand) {
                command = node.command
            } else if (msg.command) {
                command = msg.command
            } else {
                done('Command not configured — set in editor or pass msg.command')
                return
            }

            // Resolve data: static config via evaluateNodeProperty, or fall back to msg.payload
            let _data
            let evalError = false
            if (config.data || config.dataType) {
                RED.util.evaluateNodeProperty(config.data, config.dataType, node, msg, (err, result) => {
                    if (err) {
                        evalError = true
                        done(err)
                    } else {
                        _data = result
                    }
                })
            } else {
                _data = msg.payload
            }
            if (evalError) return

            node.controller.commissioningController.connectNode(deviceId)
            .then((conn) => {
                const epObj = conn.getDeviceById(Number(ep))
                const clc = epObj.getClusterClientById(cluster)
                let cmdFn = clc.commands[command]
                if (typeof cmdFn !== 'function') {
                    done(`Command '${command}' not found on cluster ${cluster}`)
                    return
                }
                if (_data == null || (typeof _data === 'object' && Object.keys(_data).length === 0)){
                    cmdFn()
                    .then(() => {
                        msg.payload = 'ok'
                        node.send(msg)
                        done()
                    })
                    .catch((e) => done(e))
                } else {
                    cmdFn(_data)
                    .then(() => {
                        msg.payload = 'ok'
                        node.send(msg)
                        done()
                    })
                    .catch((e) => done(e))
                }
            })
            .catch((e) => done(e))
        })
    }

    RED.nodes.registerType("mattercommand",MatterCommand);

}
