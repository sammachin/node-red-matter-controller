const {cap, resolveField} = require('./utils')



module.exports =  function(RED) {
    function MatterReadAttr(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.controller = RED.nodes.getNode(config.controller);

        this.on('input', async function(msg) {
            try {
                if (!node.controller || !node.controller.commissioningController) {
                    node.error('Matter controller not available — check that the controller is configured and deployed')
                    return
                }

                // Resolve device (dropdown literal, or msg/flow/global/env/jsonata)
                const deviceVal = await resolveField(RED, config.device, config.deviceType, node, msg)
                if (deviceVal == null || deviceVal === '' || deviceVal === '__SELECT__') {
                    node.error('Device not configured — set in editor or provide via msg/flow/global')
                    return
                }
                const deviceId = BigInt(String(deviceVal).split('-')[0])
                const ep = String(deviceVal).split('-')[1] || 1

                // Resolve cluster
                const clusterVal = await resolveField(RED, config.cluster, config.clusterType, node, msg)
                if (clusterVal == null || clusterVal === '' || clusterVal === '__SELECT__') {
                    node.error('Cluster not configured — set in editor or provide via msg/flow/global')
                    return
                }
                const cluster = Number(clusterVal)
                if (Number.isNaN(cluster)) {
                    node.error('Cluster is not a valid number')
                    return
                }

                // Resolve attribute
                const attrVal = await resolveField(RED, config.attr, config.attrType, node, msg)
                if (attrVal == null || attrVal === '' || attrVal === '__SELECT__') {
                    node.error('Attribute not configured — set in editor or provide via msg/flow/global')
                    return
                }
                const attr = cap(attrVal)

                const conn = await node.controller.commissioningController.connectNode(deviceId)
                const epObj = conn.getDeviceById(Number(ep))
                const clc = epObj.getClusterClientById(cluster)
                const methodName = `get${attr}Attribute`
                const command = clc[methodName]
                if (typeof command !== 'function') {
                    node.error(`Attribute getter '${methodName}' not found on cluster ${cluster}`)
                    return
                }
                const attr_resp = await command.call(clc)
                msg.payload = attr_resp
                node.send(msg)
            } catch (e) {
                node.error(e)
            }
        })
    }

    RED.nodes.registerType("matterreadattr",MatterReadAttr);

}
