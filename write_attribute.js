const {cap} = require('./utils')



module.exports =  function(RED) {
    function MatterWriteAttr(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.controller = RED.nodes.getNode(config.controller);
        node.device = BigInt(config.device)
        node.endpoint = config.endpoint || 0
        node.cluster = Number(config.cluster)
        node.attr = cap(config.attr)
        this.on('input', function(msg) {
            _data = RED.util.evaluateNodeProperty(config.data, config.dataType, node, msg);
            node.controller.commissioningController.connectNode(node.device).then((device) => {
                const ep = device.getDevices()
                const clc = ep[Number(node.endpoint)].getClusterClientById(Number(node.cluster))               
                try {
                    let command = eval(`clc.set${node.attr}Attribute`)
                    command(_data)
                    .then((attr_resp) => {
                        msg.payload = attr_resp
                        node.send(msg)
                    })
                    .catch((e) => node.error(e))
                } catch (error) {
                    node.error(error)
                }
            })
        })
    }   

    RED.nodes.registerType("matterwriteattr",MatterWriteAttr);

}
