/**
 * Shared test helpers: mock factories for the Matter commissioningController
 * and connected-device objects that the nodes interact with.
 */
var sinon = require('sinon');

/**
 * Create a stub commissioningController with the methods that action
 * nodes and editor_apis expect.
 */
function mockCommissioningController(overrides) {
    var defaults = {
        start: sinon.stub().resolves(),
        close: sinon.stub().resolves(),
        connectNode: sinon.stub().resolves(mockConnection()),
        getCommissionedNodes: sinon.stub().returns([]),
        commissionNode: sinon.stub().resolves(BigInt(1234)),
    };
    return Object.assign(defaults, overrides);
}

/**
 * Create a stub device connection returned by connectNode().
 */
function mockConnection(overrides) {
    var clusterClient = mockClusterClient();
    var defaults = {
        getDeviceById: sinon.stub().returns(mockEndpoint(clusterClient)),
        getDevices: sinon.stub().returns([mockEndpoint(clusterClient)]),
        getRootClusterClient: sinon.stub().returns(mockBasicInfo()),
        decommission: sinon.stub().resolves(),
        openEnhancedCommissioningWindow: sinon.stub().resolves({ code: '12345' }),
    };
    return Object.assign(defaults, overrides);
}

/**
 * Create a stub endpoint returned by getDeviceById() / getDevices().
 */
function mockEndpoint(clusterClient, overrides) {
    var defaults = {
        number: 1,
        deviceType: 256,  // On/Off Light
        name: 'Test-Endpoint',
        getClusterClientById: sinon.stub().returns(clusterClient || mockClusterClient()),
        getAllClusterClients: sinon.stub().returns([
            { id: 6, name: 'OnOff', attributes: { onOff: {} }, commands: { toggle: sinon.stub() } }
        ]),
    };
    return Object.assign(defaults, overrides);
}

/**
 * Create a stub cluster client with dynamic command/attribute/event methods.
 */
function mockClusterClient(overrides) {
    var defaults = {
        id: 6,
        name: 'OnOff',
        commands: {
            toggle: sinon.stub().resolves(),
            on: sinon.stub().resolves(),
            off: sinon.stub().resolves(),
        },
        attributes: {
            onOff: { attribute: { writable: false } },
        },
        events: {
            stateChange: {},
        },
        // Dynamic method stubs for subscribe / event / read / write attribute nodes
        getOnOffAttribute: sinon.stub().resolves(true),
        setOnOffAttribute: sinon.stub().resolves(),
        addOnOffAttributeListener: sinon.stub(),
        addStateChangeEventListener: sinon.stub(),
    };
    return Object.assign(defaults, overrides);
}

/**
 * Create a stub BasicInformationCluster client.
 */
function mockBasicInfo(overrides) {
    var defaults = {
        getNodeLabelAttribute: sinon.stub().resolves('Test Device'),
        setNodeLabelAttribute: sinon.stub().resolves(),
        getProductNameAttribute: sinon.stub().resolves('Test Product'),
        getVendorNameAttribute: sinon.stub().resolves('Test Vendor'),
        getSerialNumberAttribute: sinon.stub().resolves('SN12345'),
    };
    return Object.assign(defaults, overrides);
}

module.exports = {
    mockCommissioningController: mockCommissioningController,
    mockConnection: mockConnection,
    mockEndpoint: mockEndpoint,
    mockClusterClient: mockClusterClient,
    mockBasicInfo: mockBasicInfo,
};
