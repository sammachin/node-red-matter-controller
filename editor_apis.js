const {commandOptions, attributeOptions} = require('./utils')
const { BasicInformationCluster } = require( "@matter/main/clusters");
const os = require('os');

module.exports =  function(RED) {

//List Interfaces
RED.httpAdmin.get('/_mattercontroller/interfaces', RED.auth.needsPermission('admin.write'), function(req,res){
    let interfaces = os.networkInterfaces()
    let output = []
    for (let i in interfaces) {
        for (let i2 in interfaces[i]) {
            if (!interfaces[i][i2].internal && interfaces[i][i2].family == "IPv6")
                output.push(i)
        }
    }
    let uniqueOutput = output.filter(function(elem, pos) {
        return output.indexOf(elem) == pos;
    })
    res.send(uniqueOutput)
})

// List Devices
RED.httpAdmin.get('/_mattercontroller/:id/devices/', RED.auth.needsPermission('admin.write'), function(req,res){
    let ctrl_node = RED.nodes.getNode(req.params.id)
    // Use a state object so the polling function can see updates
    let state = { complete: false, devices: {} }
    if (ctrl_node){
        const nodes = ctrl_node.commissioningController.getCommissionedNodes();
        if (nodes.length === 0) {
            res.send(state.devices)
            return
        }
        let pending = nodes.length
        function markDone() {
            pending--
            if (pending <= 0) state.complete = true
        }
        nodes.forEach(nodeId => {
            ctrl_node.commissioningController.connectNode(nodeId)
            .then((conn) => {
                let endpoints = conn.getDevices()
                if (endpoints.length == 1) {  //Simple Device OR Bridge
                    if (endpoints[0].deviceType == 14) { //Bridge
                        let bridgeEps = endpoints[0].childEndpoints
                        if (bridgeEps.length === 0) {
                            markDone()
                            return
                        }
                        let bridgePending = bridgeEps.length
                        bridgeEps.forEach((ep) => {
                            let bridgedinfo = ep.getClusterClientById(57)
                            bridgedinfo.getNodeLabelAttribute()
                            .then((nodeLabel) => {
                                state.devices[`${nodeId}-${ep.number}`] = nodeLabel
                            })
                            .catch(() => {
                                state.devices[`${nodeId}-${ep.number}`] = `(unknown)`
                            })
                            .finally(() => {
                                bridgePending--
                                if (bridgePending <= 0) markDone()
                            })
                        })

                    } else { //Simple Device
                        let info = conn.getRootClusterClient(BasicInformationCluster)
                        let ep = endpoints[0]
                        info.getNodeLabelAttribute()
                        .then((nodeLabel) => {
                            state.devices[`${nodeId}-${ep.number}`] = nodeLabel
                        })
                        .catch(() => {
                            state.devices[`${nodeId}-${ep.number}`] = `(unknown)`
                        })
                        .finally(() => {
                            markDone()
                        })
                    }
                } else { //Composed Device
                    let info = conn.getRootClusterClient(BasicInformationCluster)
                        info.getNodeLabelAttribute()
                        .then((nodeLabel) => {
                            endpoints.forEach((ep) => {
                                let name = ep.name.split('-')[1]
                                state.devices[`${nodeId}-${ep.number}`] = `${nodeLabel}-${name}`
                            })
                        })
                        .catch(() => {
                            endpoints.forEach((ep) => {
                                state.devices[`${nodeId}-${ep.number}`] = `(unknown)`
                            })
                        })
                        .finally(() => {
                            markDone()
                        })
                }
            })
            .catch((error) => {
                RED.log.warn(`Matter: Could not connect to node ${nodeId}: ${error.message}`)
                markDone()
            })
        })
        listReadytoSend(res, state, 0)
        
    }
    else {
        res.sendStatus(404);  
    }

})
function listReadytoSend(res, state, elapsed) {
    if (!state.complete && elapsed < 30000) {
      setTimeout(listReadytoSend, 100, res, state, elapsed + 100)
    } else {
        res.send(state.devices)
    }
}

// List Clusters
RED.httpAdmin.get('/_mattercontroller/:cid/device/:did/clusters', RED.auth.needsPermission('admin.write'), function(req,res){
    let ctrl_node = RED.nodes.getNode(req.params.cid)
    let nodeID = BigInt(req.params.did.split('-')[0])
    let epID = Number(req.params.did.split('-')[1]) 
    if (ctrl_node){
        ctrl_node.commissioningController.connectNode(nodeID)
        .then((conn) => {
            let ep = conn.getDeviceById(epID)
            let cl = ep.getAllClusterClients()
            let clusterList = {}
            cl.forEach((c) => {
                clusterList[c.id] = c.name
            })
            res.send(clusterList)
        })
        .catch((error) => {
            RED.log.warn(`Matter: Could not list clusters: ${error.message}`)
            res.sendStatus(502)
        })
    }
    else {
        res.sendStatus(404);  
    }
})
// List Commands
RED.httpAdmin.get('/_mattercontroller/:cid/device/:did/cluster/:clid/commands', RED.auth.needsPermission('admin.write'), function(req,res){
    let ctrl_node = RED.nodes.getNode(req.params.cid)
    let nodeID = BigInt(req.params.did.split('-')[0])
    let epID = Number(req.params.did.split('-')[1]) 
    if (ctrl_node){
        ctrl_node.commissioningController.connectNode(nodeID)
        .then((conn) => {
            let ep = conn.getDeviceById(epID)
            let cmds = ep.getClusterClientById(Number(req.params.clid)).commands
            res.send(Object.keys(cmds))
        })
        .catch((error) => {
            RED.log.warn(`Matter: Could not list commands: ${error.message}`)
            res.sendStatus(502)
        })
    }
    else {
        res.sendStatus(404);  
    }
})

// Get Command options
RED.httpAdmin.get('/_mattermodel/cluster/:clid/command/:cmd/options', RED.auth.needsPermission('admin.write'), function(req,res){
        let data = commandOptions(req.params.clid, req.params.cmd)
        res.send(data)
})

// List Attributes
RED.httpAdmin.get('/_mattercontroller/:cid/device/:did/cluster/:clid/attributes', RED.auth.needsPermission('admin.write'), function(req,res){
    let ctrl_node = RED.nodes.getNode(req.params.cid)
    let nodeID = BigInt(req.params.did.split('-')[0])
    let epID = Number(req.params.did.split('-')[1])
    if (ctrl_node){
        ctrl_node.commissioningController.connectNode(nodeID)
        .then((conn) => {
            let ep = conn.getDeviceById(epID)
            let atrs = ep.getClusterClientById(Number(req.params.clid)).attributes
            res.send(Object.keys(atrs))
        })
        .catch((error) => {
            RED.log.warn(`Matter: Could not list attributes: ${error.message}`)
            res.sendStatus(502)
        })
    }
    else {
        res.sendStatus(404);  
    }
})

// List Writable Attributes
RED.httpAdmin.get('/_mattercontroller/:cid/device/:did/cluster/:clid/attributes_writable', RED.auth.needsPermission('admin.write'), function(req,res){
    let ctrl_node = RED.nodes.getNode(req.params.cid)
    let nodeID = BigInt(req.params.did.split('-')[0])
    let epID = Number(req.params.did.split('-')[1])
    if (ctrl_node){
        ctrl_node.commissioningController.connectNode(nodeID)
        .then((conn) => {
            let ep = conn.getDeviceById(epID)
            let atrs = ep.getClusterClientById(Number(req.params.clid)).attributes
            let response = []
            Object.keys(atrs).forEach((k) => {
                if (atrs[k].attribute.writable) {
                    response.push(k)
                }
            })
            res.send(response)
        })
        .catch((error) => {
            RED.log.warn(`Matter: Could not list writable attributes: ${error.message}`)
            res.sendStatus(502)
        })
    }
    else {
        res.sendStatus(404);  
    }
})

// List Events
RED.httpAdmin.get('/_mattercontroller/:cid/device/:did/cluster/:clid/events', RED.auth.needsPermission('admin.write'), function(req,res){
    let ctrl_node = RED.nodes.getNode(req.params.cid)
    let nodeID = BigInt(req.params.did.split('-')[0])
    let epID = Number(req.params.did.split('-')[1]) || 0
    if (ctrl_node){
        ctrl_node.commissioningController.connectNode(nodeID)
        .then((conn) => {
            let ep = conn.getDeviceById(epID)
            let events = ep.getClusterClientById(Number(req.params.clid)).events
            res.send(Object.keys(events))
        })
        .catch((error) => {
            RED.log.warn(`Matter: Could not list events: ${error.message}`)
            res.sendStatus(502)
        })
    }
    else {
        res.sendStatus(404);  
    }
})

// Get Attribute options
RED.httpAdmin.get('/_mattermodel/cluster/:clid/attribute/:attr/options', RED.auth.needsPermission('admin.write'), function(req,res){
    let data = attributeOptions(req.params.clid, req.params.attr)
    res.send(data)
})

RED.httpAdmin.get('/_mattercontroller/homedir', RED.auth.needsPermission('admin.write'), function(req,res){
    const homedir = require('os').homedir();
    res.send(homedir)
})

}