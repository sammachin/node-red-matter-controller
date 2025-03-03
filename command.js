


module.exports =  function(RED) {
    function MatterCommand(config) {
        RED.nodes.createNode(this, config);
        var node = this;
        node.controller = RED.nodes.getNode(config.controller);
        node._id = BigInt(config.device.split('-')[0])
        node._ep = config.device.split('-')[1]
        node.cluster = Number(config.cluster)
        this.on('input', function(msg) {
            let _data
            node.command = msg.command || config.command
            if (msg.command) {
                delete msg.command
            }
            RED.util.evaluateNodeProperty(config.data, config.dataType, node, msg, (err, result) => {
                if (err) {
                    node.error(err)
                } else {
                    _data = result
                }
            })
            node.controller.commissioningController.connectNode(node._id)
            .then((conn) => {
                const ep = conn.getDeviceById(Number(node._ep))
                const clc = ep.getClusterClientById(Number(node.cluster))
                let command = eval(`clc.commands.${node.command}`)
                if (Object.keys(_data).length == 0){
                    command()
                    .then(() => {
                        msg.payload = 'ok'
                        node.send(msg)
                    })
                    .catch((e) => node.error(e))
                } else {
                    command(_data)
                    .then(() => {
                        msg.payload = 'ok'
                        node.send(msg)
                    })
                    .catch((e) => node.error(e))
                }
            })
        })
    }   

    RED.nodes.registerType("mattercommand",MatterCommand);

}
