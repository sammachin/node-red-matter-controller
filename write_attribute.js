const {cap, resolveTyped} = require('./utils')



module.exports =  function(RED) {
    function MatterWriteAttr(config) {
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
        const hasStaticAttr = config.attr && config.attr !== "__SELECT__"
        if (hasStaticAttr) {
            node.attr = cap(config.attr)
        }

        this.on('input', function(msg) {
            if (!node.controller || !node.controller.commissioningController) {
                node.error('Matter controller not available — check that the controller is configured and deployed')
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
                node.error('Device not configured — set in editor or pass msg.device')
                return
            }

            // Resolve cluster
            let cluster
            if (hasStaticCluster) {
                cluster = node.cluster
            } else if (msg.cluster != null) {
                cluster = Number(msg.cluster)
            } else {
                node.error('Cluster not configured — set in editor or pass msg.cluster')
                return
            }

            // Resolve attribute
            let attr
            if (hasStaticAttr) {
                attr = node.attr
            } else if (msg.attr) {
                attr = cap(msg.attr)
            } else {
                node.error('Attribute not configured — set in editor or pass msg.attr')
                return
            }

            // Resolve data: static config via resolveTyped, or fall back to msg.payload
            let dataPromise
            if (config.data || config.dataType) {
                dataPromise = resolveTyped(RED, config.data, config.dataType, node, msg)
            } else {
                dataPromise = Promise.resolve(msg.payload)
            }

            dataPromise
            .then((_data) => {
                node.controller.commissioningController.connectNode(deviceId).then((conn) => {
                    const epObj = conn.getDeviceById(Number(ep))
                    const clc = epObj.getClusterClientById(cluster)
                    try {
                        const methodName = `set${attr}Attribute`
                        let command = clc[methodName]
                        if (typeof command !== 'function') {
                            node.error(`Attribute setter '${methodName}' not found on cluster ${cluster}`)
                            return
                        }
                        command.call(clc, _data)
                        .then((attr_resp) => {
                            node.log(attr_resp)
                            msg.payload = 'ok'
                            node.send(msg)
                        })
                        .catch((e) => node.error(e))
                    } catch (error) {
                        node.error(error)
                    }
                })
                .catch((e) => node.error(e))
            })
            .catch((e) => {
                node.error(e)
            })
        })
    }

    RED.nodes.registerType("matterwriteattr",MatterWriteAttr);

}
