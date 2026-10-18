
let ctrl_node = undefined
let device = undefined
let cluster = undefined
let url = undefined

const simpleClusters = [
    "3", // Identify
    "6", // OnOff
    "8", // LevelControl
    "28", // PulseWidthModulation
    "31", // AccessControl
    "37", // Actions
    "43", // LocalizationConfiguration
    "46", // PowerSourceConfiguration
    "47", // PowerSource
    "56", // TimeSynchronization
    "59", // Switch
    "69", // BooleanState
    "72", // OvenCavityOperationalState
    "73", // OvenMode
    "74", // LaundryDryerControls
    "80", // ModeSelect
    "81", // LaundryWasherMode
    "82", // RefrigeratorAndTemperatureControlledCabinetMode
    "83", // LaundryWasherControls
    "84", // RvcRunMode
    "85", // RvcCleanMode
    "86", // TemperatureControl
    "87", // RefrigeratorAlarm
    "89", // DishwasherMode
    "91", // AirQuality
    "92", // SmokeCoAlarm
    "93", // DishwasherAlarm
    "94", // MicrowaveOvenMode
    "95", // MicrowaveOvenControl
    "97", // RvcOperationalState
    "113", // HepaFilterMonitoring
    "114", // ActivatedCarbonFilterMonitoring
    "129", // ValveConfigurationAndControl
    "144", // ElectricalPowerMeasurement
    "145", // ElectricalEnergyMeasurement
    "151", // Messages
    "152", // DeviceEnergyManagement
    "153", // EnergyEvse
    "155", // EnergyPreference
    "156", // PowerTopology
    "157", // EnergyEvseMode
    "159", // DeviceEnergyManagementMode
    "257", // DoorLock
    "258", // WindowCovering
    "512", // PumpConfigurationAndControl
    "513", // Thermostat
    "514", // FanControl
    "768", // ColorControl
    "1024", // IlluminanceMeasurement
    "1026", // TemperatureMeasurement
    "1027", // PressureMeasurement
    "1028", // FlowMeasurement
    "1029", // RelativeHumidityMeasurement
    "1030", // OccupancySensing
    "1036", // CarbonMonoxideConcentrationMeasurement
    "1037", // CarbonDioxideConcentrationMeasurement
    "1043", // NitrogenDioxideConcentrationMeasurement
    "1045", // OzoneConcentrationMeasurement
    "1066", // Pm25ConcentrationMeasurement
    "1067", // FormaldehydeConcentrationMeasurement
    "1068", // Pm1ConcentrationMeasurement
    "1069", // Pm10ConcentrationMeasurement
    "1070", // TotalVolatileOrganicCompoundsConcentrationMeasurement
    "1071", // RadonConcentrationMeasurement
    "1283", // WakeOnLan
    "1289", // KeypadInput
]



const simpleCommands ={
    '3': [ 'identify' ],
    '6': [
      'off',
      'on',
      'toggle'

    ],
    '8': [
      'moveToLevel',
      'moveToLevelWithOnOff',
    ],
    '37': [
      'instantAction',
      'startAction',
      'stopAction',
      'pauseAction',
    ],
    '56': [
      'setUtcTime',
      'setTimeZone',
      'setDstOffset'
    ],
    '80': [ 'changeToMode' ],
    '86': [ 'setTemperature' ],
    '87': [ 'modifyEnabledAlarms' ],
    '92': [ 'selfTestRequest' ],
    '94': [ 'changeToMode', 'changeToModeResponse' ],
    '95': [ 'setCookingParameters', 'addMoreTime' ],
    '97': [
      'pause',
      'stop',
      'start',
      'resume',
      'operationalCommandResponse',
      'goHome'
    ],
    '129': [ 'open', 'close' ],
    '151': [ 'presentMessagesRequest', 'cancelMessagesRequest' ],
    '152': [
      'powerAdjustRequest',
      'cancelPowerAdjustRequest',
      'startTimeAdjustRequest',
      'pauseRequest',
      'resumeRequest',
      'modifyForecastRequest',
      'requestConstraintBasedForecast',
      'cancelRequest'
    ],
    '153': [
      'disable',
      'enableCharging',
      'enableDischarging',
      'startDiagnostics',
      'setTargets',
      'getTargets',
      'clearTargets',
      'getTargetsResponse'
    ],
    '257': [
      'lockDoor',
      'unlockDoor',
      'toggle',
      'unlockWithTimeout',
      'unboltDoor'
    ],
    '258': [
      'upOrOpen',
      'downOrClose',
      'stopMotion',
      'goToLiftValue',
      'goToLiftPercentage',
      'goToTiltValue',
      'goToTiltPercentage'
    ],
    '513': [
      'setpointRaiseLower'
    ],
    '514': [ 'step' ],
    '768': [
      'moveToHue',
      'moveToSaturation',
      'moveToHueAndSaturation',
      'moveToColor',
      'moveToColorTemperature',
      'enhancedMoveToHue',

    ],
    '1289': [ 'sendKey', 'sendKeyResponse' ],
}
  
const simpleAttributes = {
    '3': [  
        'identifyTime'
    ],
    '6': [
      'onOff',
      'onTime'
    ],
    '8': [
      'currentLevel',        
      'minLevel',
      'maxLevel',           
    ],
    '37': [  'actionList', 'endpointLists', 'setupUrl' ],
    '43': [  'activeLocale', 'supportedLocales' ],
    '46': [  'sources' ],
    '47': [
      'batVoltage',
      'batPercentRemaining',
      'batChargeLevel',
      'batReplacementNeeded',
      'batReplaceability',
    ],
    '56': [
      'utcTime',
      'granularity',
      'timeSource',
      'trustedTimeSource',
      'defaultNtp',
      'timeZone',
      'dstOffset',
      'localTime',
      'timeZoneDatabase',
      'ntpServerAvailable',
      'timeZoneListMaxSize',
      'dstOffsetListMaxSize',
      'supportsDnsResolve'
    ],
    '59': [
      'numberOfPositions',
      'currentPosition',
      'multiPressMax'
    ],
    '69': [  'stateValue' ],
    '74': [
      'supportedDrynessLevels',
      'selectedDrynessLevel'
    ],
    '80': [
      'description',
      'standardNamespace',
      'supportedModes',
      'currentMode',
      'startUpMode',
      'onMode'
    ],
    '81': [
      'supportedModes',
      'currentMode',
      'startUpMode',
      'onMode'
    ],
    '82': [
      'supportedModes',
      'currentMode',
      'startUpMode',
      'onMode'
    ],
    '83': [
      'spinSpeeds',
      'spinSpeedCurrent',
      'numberOfRinses',
      'supportedRinses'
    ],
    '84': [
      'supportedModes',
      'currentMode',
      'startUpMode',
      'onMode'
    ],
    '85': [
      'supportedModes',
      'currentMode',
      'startUpMode',
      'onMode'
    ],
    '86': [
      'temperatureSetpoint',
      'minTemperature',
      'maxTemperature',
      'step',
      'selectedTemperatureLevel',
      'supportedTemperatureLevels'
    ],
    '89': [
      'supportedModes',
      'currentMode',
      'startUpMode',
      'onMode'
    ],
    '91': [   'airQuality' ],
    '92': [
      'expressedState',
      'smokeState',
      'coState',
      'batteryAlert',
      'deviceMuted',
      'testInProgress',
      'hardwareFaultAlert',
      'endOfServiceAlert',
      'interconnectSmokeAlarm',
      'interconnectCoAlarm',
      'contaminationState',
      'smokeSensitivityLevel',
      'expiryDate'
    ],
    '94': [
      'supportedModes',
      'currentMode',
      'startUpMode',
      'onMode'
    ],
    '95': [
      'cookTime',
      'maxCookTime',
      'powerSetting',
      'minPower',
      'maxPower',
      'powerStep',
      'supportedWatts',
      'selectedWattIndex',
      'wattRating'
    ],
    '129': [
      'openDuration',
      'defaultOpenDuration',
      'autoCloseTime',
      'remainingDuration',
      'currentState',
      'targetState',
      'currentLevel',
      'targetLevel',
      'defaultOpenLevel',
      'valveFault',
      'levelStep'
    ],
    '144': [
      'powerMode',
      'numberOfMeasurementTypes',
      'accuracy',
      'ranges',
      'voltage',
      'activeCurrent',
      'reactiveCurrent',
      'apparentCurrent',
      'activePower',
      'reactivePower',
      'apparentPower',
      'rmsVoltage',
      'rmsCurrent',
      'rmsPower',
      'frequency',
      'harmonicCurrents',
      'harmonicPhases',
      'powerFactor',
      'neutralCurrent'
    ],
    '145': [
      'accuracy',
      'cumulativeEnergyImported',
      'cumulativeEnergyExported',
      'periodicEnergyImported',
      'periodicEnergyExported',
      'cumulativeEnergyReset'
    ],
    '151': [   'messages', 'activeMessageIDs' ],
    '152': [
      'esaType',
      'esaCanGenerate',
      'esaState',
      'absMinPower',
      'absMaxPower',
      'powerAdjustmentCapability',
      'forecast',
      'optOutState'
    ],
    '153': [
      'state',
      'supplyState',
      'faultState',
      'chargingEnabledUntil',
      'dischargingEnabledUntil',
      'circuitCapacity',
      'minimumChargeCurrent',
      'maximumChargeCurrent',
      'maximumDischargeCurrent',
      'userMaximumChargeCurrent',
      'randomizationDelayWindow',
      'nextChargeStartTime',
      'nextChargeTargetTime',
      'nextChargeRequiredEnergy',
      'nextChargeTargetSoC',
      'approximateEvEfficiency',
      'stateOfCharge',
      'batteryCapacity',
      'vehicleId',
      'sessionId',
      'sessionDuration',
      'sessionEnergyCharged',
      'sessionEnergyDischarged'
    ],
    '155': [
      'energyBalances',
      'currentEnergyBalance',
      'energyPriorities',
      'lowPowerModeSensitivities',
      'currentLowPowerModeSensitivity'
    ],
    '156': [
      'availableEndpoints',
      'activeEndpoints'
    ],
    '257': [
      'lockState',
      'lockType',
      'actuatorEnabled',
      'doorState',
      'doorOpenEvents',
      'doorClosedEvents',
    ],
    '258': [
      'type',
      'currentPositionLift',
      'currentPositionTilt',
      'numberOfActuationsLift',
      'numberOfActuationsTilt',
      'currentPositionLiftPercentage',
      'currentPositionTiltPercentage',
      'operationalStatus',
      'targetPositionLiftPercent100ths',
      'targetPositionTiltPercent100ths',
      'endProductType',
      'currentPositionLiftPercent100ths',
      'currentPositionTiltPercent100ths',
      'mode',
    ],
    '512': [
      'maxPressure',
      'maxSpeed',
      'maxFlow',
      'minConstPressure',
      'maxConstPressure',
      'minCompPressure',
      'maxCompPressure',
      'minConstSpeed',
      'maxConstSpeed',
      'minConstFlow',
      'maxConstFlow',
      'minConstTemp',
      'maxConstTemp',
      'pumpStatus',
      'effectiveOperationMode',
      'effectiveControlMode',
      'capacity',
      'speed',
      'lifetimeRunningHours',
      'power',
      'lifetimeEnergyConsumed',
      'operationMode',
      'controlMode',
      'alarmMask'
    ],
    '513': [
      'localTemperature',
      'occupancy',
      'absMinHeatSetpointLimit',
      'absMaxHeatSetpointLimit',
      'absMinCoolSetpointLimit',
      'absMaxCoolSetpointLimit',
      'occupiedCoolingSetpoint',
      'occupiedHeatingSetpoint',
      'unoccupiedCoolingSetpoint',
      'unoccupiedHeatingSetpoint',
      'minHeatSetpointLimit',
      'maxHeatSetpointLimit',
      'minCoolSetpointLimit',
      'maxCoolSetpointLimit',
      'minSetpointDeadBand'
    ],
    '514': [
       
      'fanMode',         
      'fanModeSequence',
      'percentSetting',  
      'percentCurrent',
      'speedMax',        
      'speedSetting',
      'speedCurrent',    
      'rockSupport',
      'rockSetting',     
      'windSupport',
      'windSetting',     
      'airflowDirection'
    ],
    '768': [
      'currentHue',
      'currentSaturation',
      'colorTemperatureMireds',
      'colorMode'
    ],
    '1024': [
      'measuredValue',
      'minMeasuredValue',
      'maxMeasuredValue',
      'tolerance',
      'lightSensorType'
    ],
    '1026': [
      'measuredValue',
      'minMeasuredValue',
      'maxMeasuredValue',
      'tolerance'
    ],
    '1027': [
      'measuredValue',
      'minMeasuredValue',
      'maxMeasuredValue',
      'tolerance',
      'scaledValue',
      'minScaledValue',
      'maxScaledValue',
      'scaledTolerance',
      'scale'
    ],
    '1028': [
      'measuredValue',
      'minMeasuredValue',
      'maxMeasuredValue',
      'tolerance'
    ],
    '1029': [
      'measuredValue',
      'minMeasuredValue',
      'maxMeasuredValue',
      'tolerance'
    ],
    '1030': [
      'occupancy',
      'occupancySensorType'
    ],
    '1283': [ 'macAddress', 'linkLocalAddress' ],
  }
  

function getDevices() {
    //console.log('getDevices')
    ctrl_node = document.getElementById('node-input-controller').value
    // Clear downstream selects so stale values don't persist
    resetSelect("node-input-cluster")
    resetSelect("node-input-command")
    resetSelect("node-input-attr")
    resetSelect("node-input-event")
    if (!(ctrl_node == undefined || ctrl_node == '_ADD_')){
        url =`_mattercontroller/${ctrl_node}/devices`
        getJSON('refresh-devices', 'node-input-device', url, function(r) {
            let devices = document.getElementById("node-input-device");
            removeOptions(devices)
            Object.keys(r).forEach(d => {
                let option = document.createElement("option");
                option.text = r[d]
                option.value = d
                option.id = d
                devices.add(option); 
            });  
        })
    }
}


function getClusters(){
    //console.log('getClusters')
    ctrl_node = document.getElementById('node-input-controller').value
    device = document.getElementById('node-input-device').value
    let simpleMode = document.getElementById("node-input-simpleMode")
    // Clear downstream selects so stale values don't persist
    resetSelect("node-input-command")
    resetSelect("node-input-attr")
    resetSelect("node-input-event")
    if ((ctrl_node != '_ADD_' && ctrl_node != undefined) && (device != undefined && device != '__SELECT__')){
        url =`_mattercontroller/${ctrl_node}/device/${device}/clusters`
        getJSON('refresh-clusters', 'node-input-cluster', url, function(r) {
            let clusters = document.getElementById("node-input-cluster");
            removeOptions(clusters)
            Object.keys(r).forEach(d => {
                if (simpleMode.checked){
                    if (simpleClusters.includes(d)) {
                        let option = document.createElement("option");
                        option.text = r[d]
                        option.value = d
                        option.id = d
                        clusters.add(option);
                    }
                } else {
                    let option = document.createElement("option");
                    option.text = r[d]
                    option.value = d
                    option.id = d
                    clusters.add(option);
                }
            });            
        })
    }
}

function getCommands(){
    //console.log('getCommands')
    ctrl_node = document.getElementById('node-input-controller').value
    device = document.getElementById('node-input-device').value
    cluster = document.getElementById('node-input-cluster').value
    let simpleMode = document.getElementById("node-input-simpleMode")
    if ((ctrl_node != '_ADD_' && ctrl_node != undefined) && (device != undefined && device != '__SELECT__') && (cluster != undefined && cluster != '__SELECT__')){
        url =`_mattercontroller/${ctrl_node}/device/${device}/cluster/${cluster}/commands`
        getJSON('refresh-commands', 'node-input-command', url, function(r) {
            let commands = document.getElementById("node-input-command");
            removeOptions(commands)
            let filtered = r.filter(d => !simpleMode.checked || (simpleCommands[cluster] && simpleCommands[cluster].includes(d)))
            if (filtered.length === 0) {
                let option = document.createElement("option");
                option.text = 'No commands available'
                option.value = ''
                option.disabled = true
                option.selected = true
                commands.add(option)
                return
            }
            filtered.forEach(d => {
                let option = document.createElement("option");
                option.text = d
                option.value = d
                option.id = d
                commands.add(option);
            });
        })
    }
}
function getAttributes(writable=false){
    //console.log(`getAttributes, ${writable}`)
    ctrl_node = document.getElementById('node-input-controller').value
    device = document.getElementById('node-input-device').value
    cluster = document.getElementById('node-input-cluster').value
    let simpleMode = document.getElementById("node-input-simpleMode")
    if ((ctrl_node != '_ADD_' && ctrl_node != undefined) && (device != undefined && device != '__SELECT__') && (cluster != undefined && cluster != '__SELECT__')){
        if (writable){
            url =`_mattercontroller/${ctrl_node}/device/${device}/cluster/${cluster}/attributes_writable`
        } else{
            url =`_mattercontroller/${ctrl_node}/device/${device}/cluster/${cluster}/attributes`
        }
        getJSON('refresh-attr', 'node-input-attr', url, function(r) {
            let attrs = document.getElementById("node-input-attr");
            removeOptions(attrs)
            let filtered = r.filter(d => !simpleMode.checked || (simpleAttributes[cluster] && simpleAttributes[cluster].includes(d)))
            if (filtered.length === 0) {
                let option = document.createElement("option");
                option.text = writable ? 'No writable attributes available' : 'No attributes available'
                option.value = ''
                option.disabled = true
                option.selected = true
                attrs.add(option)
                return
            }
            filtered.forEach(d => {
                let option = document.createElement("option");
                option.text = d
                option.value = d
                option.id = d
                attrs.add(option);
            });
        })
    }
}
function clearSelect(elementId) {
    let el = document.getElementById(elementId);
    if (el) removeOptions(el)
}

function resetSelect(elementId) {
    let el = document.getElementById(elementId);
    if (!el) return
    // Detach and reattach jQuery change handlers to prevent spurious
    // cascading when we programmatically reset the select value.
    let events = $._data(el, 'events')
    let changeHandlers = events && events.change ? events.change.slice() : []
    $(el).off('change')
    removeOptions(el)
    changeHandlers.forEach(function(h) { $(el).on('change', h.handler) })
}

// Populate a select with only the node's already-saved (deployed) value so the
// dropdown shows the current selection immediately, without calling the slow
// server endpoints. The full option list is fetched on demand via Refresh.
function restoreSelect(elementId, value, text) {
    let el = document.getElementById(elementId)
    if (!el) return
    removeOptions(el)
    if (isRealValue(value)) {
        let option = document.createElement("option")
        option.text = (text !== undefined && text !== null && text !== '') ? text : value
        option.value = value
        option.id = value
        option.selected = true
        el.add(option)
    }
}

function getEvents(){
    //console.log('getEvents')
    ctrl_node = document.getElementById('node-input-controller').value
    device = document.getElementById('node-input-device').value
    cluster = document.getElementById('node-input-cluster').value
    if ((ctrl_node != '_ADD_' && ctrl_node != undefined) && (device != undefined && device != '__SELECT__') && (cluster != undefined && cluster != '__SELECT__')){
        url =`_mattercontroller/${ctrl_node}/device/${device}/cluster/${cluster}/events`
        getJSON('refresh-event', 'node-input-event', url, function(r) {
            let events = document.getElementById("node-input-event");
            removeOptions(events)
            if (r.length === 0) {
                let option = document.createElement("option");
                option.text = 'No events available for this cluster'
                option.value = ''
                option.disabled = true
                option.selected = true
                events.add(option)
                return
            }
            r.forEach(d => {
                let option = document.createElement("option");
                option.text = d
                option.value = d
                option.id = d
                events.add(option);
            });
        })
    }
}
function getCommandOpts(){
    let clusterID = document.getElementById("node-input-cluster").value
    let command = document.getElementById("node-input-command").value
    url = `_mattermodel/cluster/${clusterID}/command/${command}/options`
    getJSON('refresh-sample', null, url, function(r) {
        document.getElementById('sample-data').innerHTML=JSON.stringify(r, null, 2)
    })
}

function getAttributeOpts(){
    //console.log(`getAttributeOpts`)
    let clusterID = document.getElementById("node-input-cluster").value
    let attribute = document.getElementById("node-input-attr").value
    url = `_mattermodel/cluster/${clusterID}/attribute/${attribute}/options`
    getJSON('refresh-sample', null, url, function(r) {
        let details = r.details
        delete(r.details)
        document.getElementById('sample-data').innerHTML=JSON.stringify(r, null, 2)
        document.getElementById('sample-details').innerHTML=details
    })
}


// Spin a refresh button's icon while its request is pending.
function spinButton(buttonId, on) {
    $('#' + buttonId + ' i').toggleClass('fa-spin', on)
}

// $.get wrapper that, while the request is in flight, spins the given refresh
// button and disables the target select (so it can't be opened). Both are
// cleared on completion, whether the request succeeds or fails. Pass a falsy
// selectId when the request doesn't populate a dropdown (e.g. the sample data).
function getJSON(buttonId, selectId, url, cb) {
    spinButton(buttonId, true)
    if (selectId) $('#' + selectId).prop('disabled', true)
    return $.get(url, cb).always(function() {
        spinButton(buttonId, false)
        if (selectId) $('#' + selectId).prop('disabled', false)
    })
}

function removeOptions(selectElement) {
   let i, L = selectElement.options.length - 1;
   for(i = L; i >= 0; i--) {
      selectElement.remove(i);
   }
}

// Helper: returns true if a config value is a real selection
// (not empty, not a placeholder sentinel, not undefined)
function isRealValue(v) {
    return v != null && v !== '' && v !== '__SELECT__' && v !== 'undefined'
}

// Helper: get display text from a select element, or "" if placeholder
function getSelectedText(elementId) {
    let el = document.getElementById(elementId)
    if (!el || el.selectedIndex < 0) return ""
    let val = el.options[el.selectedIndex].value
    if (!isRealValue(val)) return ""
    return el.options[el.selectedIndex].innerHTML
}

// ---------------------------------------------------------------------------
// TypedInput variants — used only by the command / read_attribute /
// write_attribute nodes, whose device / cluster / action fields are TypedInputs
// (a custom API-populated dropdown type plus msg/flow/global/env/jsonata).
// The plain-select functions above are still used by subscribe / event, so do
// NOT fold these together.
// ---------------------------------------------------------------------------

// Maps a selected value to its friendly label, for oneditsave deviceName/clusterName.
let deviceNameCache = {}
let clusterNameCache = {}

// A TypedInput type carrying an options array renders as a dropdown. Fields are
// required, so there is no placeholder option — an empty list means no selection.
function deviceTypeDef(options) {
    return { value: 'matterDevice', label: 'Device', icon: 'fa fa-sitemap', options: options || [] }
}
function clusterTypeDef(options) {
    return { value: 'matterCluster', label: 'Cluster', icon: 'fa fa-cubes', options: options || [] }
}
function actionTypeDef(key, label, options) {
    return { value: key, label: label, icon: 'fa fa-bolt', options: options || [] }
}

// Swap a TypedInput's custom-type options, preserving the current type/value.
function setTypedOptions(fieldId, typeDef) {
    let $el = $('#' + fieldId)
    if (!$el.length) return
    let curType = $el.typedInput('type')
    let curVal = $el.typedInput('value')
    $el.typedInput('types', [ typeDef, 'msg', 'flow', 'global', 'env', 'jsonata' ])
    $el.typedInput('type', curType)
    if (curType === typeDef.value) $el.typedInput('value', curVal)
}

// Initialise a TypedInput, seeding the custom type with the saved value as its
// only option so the field shows its current selection instantly on open without
// an API call. Value/type are read from the input + hidden typeField elements.
function initTypedField(fieldId, typeFieldId, savedValue, savedLabel, typeDef, nameCache) {
    let seed = isRealValue(savedValue)
        ? [{ value: savedValue, label: (savedLabel && savedLabel !== '') ? savedLabel : savedValue }]
        : []
    if (isRealValue(savedValue) && nameCache) nameCache[savedValue] = seed[0].label
    let def = Object.assign({}, typeDef, { options: seed })
    $('#' + fieldId).typedInput({
        typeField: $('#' + typeFieldId),
        types: [ def, 'msg', 'flow', 'global', 'env', 'jsonata' ]
    })
}

// Clear a downstream TypedInput's custom options (empty = no selection).
// typeDefFactory(options) builds the field's custom type definition.
function resetTyped(fieldId, typeDefFactory) {
    let $el = $('#' + fieldId)
    if (!$el.length) return
    let def = typeDefFactory(null)
    let curType = $el.typedInput('type')
    $el.typedInput('types', [ def, 'msg', 'flow', 'global', 'env', 'jsonata' ])
    $el.typedInput('type', curType)
    if (curType === def.value) $el.typedInput('value', '')
}

// Read a dependency field only when it holds a concrete (dropdown) value; returns
// null when the field is an expression (msg/flow/etc) with no literal to query.
function typedLiteral(fieldId, customKey) {
    let $el = $('#' + fieldId)
    if (!$el.length || $el.typedInput('type') !== customKey) return null
    let v = $el.typedInput('value')
    return isRealValue(v) ? v : null
}

// Show + enable the given refresh button(s) only while the field is on its custom
// dropdown type; hide + disable them when the field is a msg/flow/etc expression
// (there is nothing to fetch for an expression). Re-evaluated on every type change.
function bindRefreshVisibility(fieldId, customKey, buttonIds) {
    let $el = $('#' + fieldId)
    if (!$el.length) return
    let update = function() {
        let isCustom = $el.typedInput('type') === customKey
        buttonIds.forEach(function(b) {
            let $btn = $('#' + b)
            if (isCustom) { $btn.show().removeClass('disabled') }
            else { $btn.hide().addClass('disabled') }
        })
    }
    $el.on('change', update)
    update()
}

function getDevicesTyped() {
    let ctrl = $('#node-input-controller').val()
    resetTyped('node-input-cluster', clusterTypeDef)
    resetTyped('node-input-command', function(o) { return actionTypeDef('matterCommand', 'Command', o) })
    resetTyped('node-input-attr', function(o) { return actionTypeDef('matterAttr', 'Attribute', o) })
    if (!ctrl || ctrl === '_ADD_') return
    $('#node-input-device').typedInput('disable', true)
    getJSON('refresh-devices', null, `_mattercontroller/${ctrl}/devices`, function(r) {
        let options = Object.keys(r).map(function(d) { return { value: d, label: r[d] } })
        deviceNameCache = {}
        options.forEach(function(o) { deviceNameCache[o.value] = o.label })
        setTypedOptions('node-input-device', deviceTypeDef(options))
    }).always(function() { $('#node-input-device').typedInput('disable', false) })
}

function getClustersTyped() {
    let ctrl = $('#node-input-controller').val()
    resetTyped('node-input-command', function(o) { return actionTypeDef('matterCommand', 'Command', o) })
    resetTyped('node-input-attr', function(o) { return actionTypeDef('matterAttr', 'Attribute', o) })
    let device = typedLiteral('node-input-device', 'matterDevice')
    if (!ctrl || ctrl === '_ADD_' || device == null) return
    let simpleMode = document.getElementById("node-input-simpleMode")
    $('#node-input-cluster').typedInput('disable', true)
    getJSON('refresh-clusters', null, `_mattercontroller/${ctrl}/device/${device}/clusters`, function(r) {
        clusterNameCache = {}
        Object.keys(r).forEach(function(d) { clusterNameCache[d] = r[d] })
        let options = []
        Object.keys(r).forEach(function(d) {
            if (!simpleMode.checked || simpleClusters.includes(d)) {
                options.push({ value: d, label: r[d] })
            }
        })
        setTypedOptions('node-input-cluster', clusterTypeDef(options))
    }).always(function() { $('#node-input-cluster').typedInput('disable', false) })
}

function getCommandsTyped() {
    let ctrl = $('#node-input-controller').val()
    let device = typedLiteral('node-input-device', 'matterDevice')
    let cluster = typedLiteral('node-input-cluster', 'matterCluster')
    if (!ctrl || ctrl === '_ADD_' || device == null || cluster == null) return
    let simpleMode = document.getElementById("node-input-simpleMode")
    $('#node-input-command').typedInput('disable', true)
    getJSON('refresh-commands', null, `_mattercontroller/${ctrl}/device/${device}/cluster/${cluster}/commands`, function(r) {
        let filtered = r.filter(function(d) { return !simpleMode.checked || (simpleCommands[cluster] && simpleCommands[cluster].includes(d)) })
        let options = filtered.length
            ? filtered.map(function(d) { return { value: d, label: d } })
            : [{ value: '', label: 'No commands available' }]
        setTypedOptions('node-input-command', actionTypeDef('matterCommand', 'Command', options))
    }).always(function() { $('#node-input-command').typedInput('disable', false) })
}

function getAttributesTyped(writable) {
    let ctrl = $('#node-input-controller').val()
    let device = typedLiteral('node-input-device', 'matterDevice')
    let cluster = typedLiteral('node-input-cluster', 'matterCluster')
    if (!ctrl || ctrl === '_ADD_' || device == null || cluster == null) return
    let simpleMode = document.getElementById("node-input-simpleMode")
    let url = writable
        ? `_mattercontroller/${ctrl}/device/${device}/cluster/${cluster}/attributes_writable`
        : `_mattercontroller/${ctrl}/device/${device}/cluster/${cluster}/attributes`
    $('#node-input-attr').typedInput('disable', true)
    getJSON('refresh-attr', null, url, function(r) {
        let filtered = r.filter(function(d) { return !simpleMode.checked || (simpleAttributes[cluster] && simpleAttributes[cluster].includes(d)) })
        let emptyLabel = writable ? 'No writable attributes available' : 'No attributes available'
        let options = filtered.length
            ? filtered.map(function(d) { return { value: d, label: d } })
            : [{ value: '', label: emptyLabel }]
        setTypedOptions('node-input-attr', actionTypeDef('matterAttr', 'Attribute', options))
    }).always(function() { $('#node-input-attr').typedInput('disable', false) })
}
