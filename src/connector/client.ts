import { ControllerFactory as EFMControllerFactory } from '../driver/efm/lib';
import { CiscoCredential, ControllerFactory as CiscoControllerFactory } from '../driver/cisco/lib';
import { ControllerFactory as GenericControllerFactory } from '../driver/generic/lib';
import { VLAN as GenericVLAN } from '../driver/generic/VLAN';
import WebSocket from 'ws';

import { MIBLoader } from '../util/snmp/mibloader';
import { CiscoTFTPServer } from '../util/tftp';
import { SvcRunner } from '../util/svcrunner';
import path from 'path';

import fs from 'fs';

import YAML from 'yaml';
import { MethodNotAvailableError, RPCProvider, RPCv2Request } from './jsonrpcv2';
import { SwitchConfiguratorReqHandler as CiscoSwitchConfiguratorReqHandler } from './requesthandler/cisco/SwitchConfigurator';

const configFile = YAML.parse(fs.readFileSync('./config.yaml').toString('utf-8'));

interface EFMCredential {
    id: string,
    pass: string,
}

interface ConnectorDevice {
    id: string,
    addr: string,
    type: 'efm' | 'cisco',
    credential: EFMCredential | CiscoCredential,
}

interface ConnectorClientConfig {
    remote: {
        token: string,
        url: string,
    },
    tftpserver: {
        hostip: string,
    },
    devices: ConnectorDevice[],
}

async function svcmain() {
    // Initialize essential services
    console.log('Main process started');
    const connectorClient = new ConnectorClient(configFile);
    await connectorClient.startSvcs();
    console.log('Service started.');
    await connectorClient.initializeConfigurator();
    console.log('Configurator initialized');
    await connectorClient.connect();
    console.log('Connected.');
}

export {svcmain};

export class ConnectorClient {
    private config: ConnectorClientConfig;
    private tftp: CiscoTFTPServer;
    private ciscoCfgSvcRunner: SvcRunner;
    private controllerFactoryTable: {[key: string]: {device: ConnectorDevice, controllerFactory: GenericControllerFactory}} = {};
    private rpc: RPCProvider | null = null;
    private client: WebSocket | null = null;

    constructor(config: ConnectorClientConfig) {
        this.config = config;
        // Essential services
        this.tftp = new CiscoTFTPServer(config.tftpserver.hostip);
        const launcherPath = path.join(__dirname, '../../ciscocfg/launcher.sh');
        this.ciscoCfgSvcRunner = new SvcRunner(launcherPath);
    }

    async startSvcs() {
        this.tftp.listen();
        await this.ciscoCfgSvcRunner.start();
    }

    async endSvcs() {
        this.tftp.close();
        await this.ciscoCfgSvcRunner.stop();
    }

    async connect() {
        if (this.client != null) return;
        this.client = new WebSocket(this.config.remote.url, {
            headers: {
                // TODO: FIXME: Follow server-side auth
                Authorization: ` Token ${this.config.remote.token}`
            }
        });

        await new Promise((ful) => {
            this.client?.on('open', () => {
                this.client?.removeAllListeners('open');
                ful(null);
            });
        });
        this.rpc = new RPCProvider(this.client);
        await this.registerRPCHandlers();
        this.rpc.remoteNotify({
            jsonrpc: '2.0',
            method: 'init',
            params: [],
        });
    }

    public async registerRPCHandlers() {
        if (this.rpc == null) {
            throw new Error('You have to connect to RPC first!');
        }

        this.rpc.addRequestHandler(this.deviceInfoRPCRequestHandler.bind(this));

        for(const id of Object.keys(this.controllerFactoryTable)) {
            const controllerFactoryEnt = this.controllerFactoryTable[id];

            if (controllerFactoryEnt.controllerFactory instanceof CiscoControllerFactory) {
                const ciscoControllerFactory: CiscoControllerFactory = controllerFactoryEnt.controllerFactory;
                await ciscoControllerFactory.authenticate(controllerFactoryEnt.device.credential as CiscoCredential);
                const reqHandlerObj = new CiscoSwitchConfiguratorReqHandler(id, ciscoControllerFactory.getSwitchConfigurator());

                this.rpc.addRequestHandler(reqHandlerObj.getRPCHandler());
            }
        }
    }

    private async deviceInfoRPCRequestHandler(req: RPCv2Request): Promise<{id: string, type: string}[]> {
        if (req.class != null || req.target != null) {
            throw new MethodNotAvailableError('Method not available in this handler');
        }

        switch (req.method) {
            case 'getRegisteredDevices':
                return Object.keys(this.controllerFactoryTable).filter((elem) => {
                    return this.controllerFactoryTable[elem].controllerFactory != null;
                }).map((k) => {
                    const dev = this.controllerFactoryTable[k].device;
                    return {
                        id: dev.id,
                        type: dev.type,
                    };
                });
            default:
                throw new MethodNotAvailableError('Method not available in this handler')
        }
    }

    public async disconnect() {
        if (this.client == null) return;
        this.client.close();
        this.client = null;
        this.rpc = null;
        // TODO: Remove all handler from RPC
    }

    public async initializeConfigurator(): Promise<void> {
        for (const device of this.config.devices) {
            let controllerfactory: GenericControllerFactory | null = null;

            try {
                switch (device.type) {
                    case 'efm':
                        controllerfactory = new EFMControllerFactory(device.addr);
                        break;
                    case 'cisco':
                        controllerfactory = new CiscoControllerFactory(
                            device.addr,
                            './mibjson/cisco.json',
                            this.tftp,
                        );
                        break;
                }

                // Let's test-authenticate it
                await controllerfactory.authenticate(device.credential);
            } catch (e) {
                console.warn(`Failed to initialize device ${device.id}`);
                console.warn(e);
            }

            this.controllerFactoryTable[device.id] = {
                device: device,
                controllerFactory: controllerfactory as GenericControllerFactory,
            };
        }
    }

    public async getControllerFactory(id: string): Promise<GenericControllerFactory> {
        const controllerFactoryTableEnt = this.controllerFactoryTable[id];
        if (controllerFactoryTableEnt == null) {
            throw new Error('Entity not available');
        }

        await controllerFactoryTableEnt.controllerFactory.authenticate(controllerFactoryTableEnt.device.credential);
        return controllerFactoryTableEnt.controllerFactory;
    }
}