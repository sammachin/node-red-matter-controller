
const Models = require( "@matter/main/model")


function deCap(string) {
    return string.charAt(0).toLowerCase() + string.slice(1);
}
function cap(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}


function commandOptions(clusterID, commandName){
    let data = {}
    let clusterName = Models.MatterModel.standard.get(Models.ClusterModel, Number(clusterID)).name
    let cluster = Models[clusterName]
    cluster.commands.forEach((cmd, i) => {
        if (cmd.name == cap(commandName)){
            let vars = cluster.commands[i].children.flat()
            vars.forEach(f => {
                let key = deCap(f.name)
                let val
                if ('default' in f){
                    val = f.default
                } else if 
                ('constraint' in f && f.constraint != 'all'){
                    val = `[${f.constraint}]`
                } else if 
                ('type' in f){
                    val = `[${f.type}]`
                } else {
                    val = ''
                }
                data[key] = val
            });
        }
    });
    return data
}

function attributeOptions(clusterID, attributeName){
    let data = {}
    let clusterName = Models.MatterModel.standard.get(Models.ClusterModel, Number(clusterID)).name
    let cluster = Models[clusterName]
    cluster.attributes.forEach((attr, i) => {
        if (attr.name == cap(attributeName)){
            data.name = attr.name
            data.default = attr.default || ''
            data.constraint = attr.constraint || ''
            data.type = attr.type
            data.details = attr.details || ''
        }
    })
    return data
}

// Functions to update the simples lists
function listClusters(){
    Models.MatterModel.standard.clusters.forEach((cl) => {
    console.log(`"${cl.id}", // ${cl.name}`)
    })
}

function getCommands(clusterList){
    let simpleCommands = {}
    clusterList.forEach((clusterID) => {
        simpleCommands[clusterID] = []
        let clusterName = Models.MatterModel.standard.get(Models.ClusterModel, Number(clusterID)).name
        let cluster = Models[clusterName]
        cluster.commands.forEach((cmd, i) => {
            simpleCommands[clusterID].push(deCap(cmd.name))
        })
    })
    return simpleCommands

}

function getAttributes(clusterList){
    let simpleAttributes = {}
    clusterList.forEach((clusterID) => {
        simpleAttributes[clusterID] = []
        let clusterName = Models.MatterModel.standard.get(Models.ClusterModel, Number(clusterID)).name
        let cluster = Models[clusterName]
        cluster.attributes.forEach((attr, i) => {
            simpleAttributes[clusterID].push(deCap(attr.name))
        })
    })
    return simpleAttributes

}

function resolveTyped(RED, data, dataType, node, msg){
    return new Promise(function(resolve, reject) {
        if  (dataType == 'null'){
           resolve(null)
        } else {
            RED.util.evaluateNodeProperty(data, dataType, node, msg, (err, result) => {
                if (err) {reject(err) } 
                else {
                    resolve(result)
                }
             })
        }
        
    })
}

module.exports = {commandOptions, attributeOptions, deCap, cap, resolveTyped, listClusters, getCommands, getAttributes}