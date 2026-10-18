

const { resolveField, resolveTyped } = require('./utils')

module.exports =  function(RED) {
    function MatterCommand(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.controller = RED.nodes.getNode(config.controller);

        this.on('input', async function(msg, send, done) {
            try {
                if (!node.controller || !node.controller.commissioningController) {
                    done('Matter controller not available — check that the controller is configured and deployed')
                    return
                }

                // Resolve device (dropdown literal, or msg/flow/global/env/jsonata)
                const deviceVal = await resolveField(RED, config.device, config.deviceType, node, msg)
                if (deviceVal == null || deviceVal === '' || deviceVal === '__SELECT__') {
                    done('Device not configured — set in editor or provide via msg/flow/global')
                    return
                }
                const deviceId = BigInt(String(deviceVal).split('-')[0])
                const ep = String(deviceVal).split('-')[1] || 1

                // Resolve cluster
                const clusterVal = await resolveField(RED, config.cluster, config.clusterType, node, msg)
                if (clusterVal == null || clusterVal === '' || clusterVal === '__SELECT__') {
                    done('Cluster not configured — set in editor or provide via msg/flow/global')
                    return
                }
                const cluster = Number(clusterVal)
                if (Number.isNaN(cluster)) {
                    done('Cluster is not a valid number')
                    return
                }

                // Resolve command
                const commandVal = await resolveField(RED, config.command, config.commandType, node, msg)
                if (commandVal == null || commandVal === '' || commandVal === '__SELECT__') {
                    done('Command not configured — set in editor or provide via msg/flow/global')
                    return
                }
                const command = commandVal

                // Resolve data: typed config value, or fall back to msg.payload
                let _data
                if (config.data || config.dataType) {
                    _data = await resolveTyped(RED, config.data, config.dataType, node, msg)
                } else {
                    _data = msg.payload
                }

                const conn = await node.controller.commissioningController.connectNode(deviceId)
                const epObj = conn.getDeviceById(Number(ep))
                const clc = epObj.getClusterClientById(cluster)
                const cmdFn = clc.commands[command]
                if (typeof cmdFn !== 'function') {
                    done(`Command '${command}' not found on cluster ${cluster}`)
                    return
                }
                if (_data == null || (typeof _data === 'object' && Object.keys(_data).length === 0)){
                    await cmdFn()
                } else {
                    await cmdFn(_data)
                }
                msg.payload = 'ok'
                node.send(msg)
                done()
            } catch (e) {
                done(e)
            }
        })
    }

    RED.nodes.registerType("mattercommand",MatterCommand);

}
