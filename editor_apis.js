const {commandOptions, attributeOptions} = require('./utils')
const { BasicInformationCluster } = require( "@matter/main/clusters");
const os = require('os');
let listComplete = false
let deviceList = {}

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
    uniqueOutput = output.filter(function(elem, pos) {
        return output.indexOf(elem) == pos;
    })
    res.send(uniqueOutput)
})

// List Devices
RED.httpAdmin.get('/_mattercontroller/:id/devices/', RED.auth.needsPermission('admin.write'), function(req,res){
    let ctrl_node = RED.nodes.getNode(req.params.id)
    listComplete = false
    deviceList = {}
    if (ctrl_node){
        const nodes = ctrl_node.commissioningController.getCommissionedNodes();
        nodes.forEach(nodeId => {
            ctrl_node.commissioningController.connectNode(nodeId)
            .then((conn) => {
                let endpoints = conn.getDevices()
                if (endpoints.length == 1) {  //Simple Device OR Bridge
                    if (endpoints[0].deviceType == 14) { //Bridge
                        endpoints[0].childEndpoints.forEach((ep) => {
                            bridgedinfo = ep.getClusterClientById(57)
                            bridgedinfo.getNodeLabelAttribute()
                            .then((nodeLabel) => {
                                deviceList[`${nodeId}-${ep.number}`] = nodeLabel
                            })
                        })
                        listComplete = true

                    } else { //Simple Device
                        info = conn.getRootClusterClient(BasicInformationCluster)
                        ep = endpoints[0]
                        info.getNodeLabelAttribute()
                        .then((nodeLabel) => {
                            deviceList[`${nodeId}-${ep.number}`] = nodeLabel
                            listComplete = true
                        })
                    }
                } else { //Composed Device
                    info = conn.getRootClusterClient(BasicInformationCluster)
                        info.getNodeLabelAttribute()
                        .then((nodeLabel) => {
                            endpoints.forEach((ep) => {
                                let name = ep.name.split('-')[1]
                                deviceList[`${nodeId}-${ep.number}`] = `${nodeLabel}-${name}`
                            })
                            listComplete = true
                        })
                }
            }).catch((e) => ctrl_node.error(e))
        })
        listReadytoSend(res)
        
    }
    else {
        res.sendStatus(404);  
    }

})
function listReadytoSend(res) {
    if (!listComplete) {
      setTimeout(listReadytoSend, 100, res)
    } else {
        res.send(deviceList)
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
            clusterList = {}
            cl.forEach((c) => {
                clusterList[c.id] = c.name
            })
            res.send(clusterList)
        }).catch((e) => ctrl_node.error(e))
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
            cmds = ep.getClusterClientById(Number(req.params.clid)).commands
            res.send(Object.keys(cmds))
        }).catch((e) => ctrl_node.error(e))
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
            atrs = ep.getClusterClientById(Number(req.params.clid)).attributes
            res.send(Object.keys(atrs))
        }).catch((e) => ctrl_node.error(e))
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
            atrs = ep.getClusterClientById(Number(req.params.clid)).attributes
            let response = []
            Object.keys(atrs).forEach((k) => {
                if (atrs[k].attribute.writable) {
                    response.push(k)
                }
            })
            res.send(response)
        }).catch((e) => ctrl_node.error(e))
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
            events = ep.getClusterClientById(Number(req.params.clid)).events
            res.send(Object.keys(events))
        }).catch((e) => ctrl_node.error(e))
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