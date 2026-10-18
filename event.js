const {cap} = require('./utils')



module.exports =  function(RED) {
    function MatterEvent(config) {
        RED.nodes.createNode(this, config);
        const node = this;
        node.controller = RED.nodes.getNode(config.controller);
        if (!node.controller) {
            node.error('Matter controller not available — check that the controller is configured and deployed')
            node.status({fill:"red",shape:"dot",text:"no controller"})
            return
        }
        if (!config.device || config.device === "__SELECT__") {
            node.status({fill:"yellow",shape:"dot",text:"not configured"})
            return
        }
        node._id = BigInt(config.device.split('-')[0])
        node._ep = config.device.split('-')[1] || 1
        node.cluster = Number(config.cluster)
        node.event = cap(config.event)
        node.topic = config.topic
        
        function subscribe(node){
            node.controller.commissioningController.connectNode(node._id)
            .then((conn) => {
                const ep = conn.getDeviceById(Number(node._ep))
                const clc = ep.getClusterClientById(Number(node.cluster))
                const methodName = `add${node.event}EventListener`
                const listener = clc[methodName]
                if (typeof listener !== 'function') {
                    node.error(`Event listener method '${methodName}' not found on cluster ${node.cluster}`)
                    node.status({fill:"red",shape:"dot",text:"invalid event"})
                    return
                }
                listener.call(clc, value => {
                    let msg = {topic: node.topic}
                    msg.payload = value
                    node.send(msg)
                })
            })
            .catch((error) => {
                node.error(`Failed to subscribe to event: ${error.message}`)
                node.status({fill:"red",shape:"dot",text:"error"})
            })
        }

        let waitTimer = null
        function waitforserver(node) {
            if (!node.controller.started) {
              waitTimer = setTimeout(waitforserver, 100, node)
            } else {
                node.log('Setting Event...')
                subscribe(node)
            }
        }
        
        waitforserver(node)

        node.on('close', function() {
            if (waitTimer) {
                clearTimeout(waitTimer)
                waitTimer = null
            }
        })
    }   
    RED.nodes.registerType("matterevent",MatterEvent);

}
