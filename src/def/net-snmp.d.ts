// TODO: Remove all the ANY

interface SNMPSession {
    get: (oids: string[], cb: (err: Error, val: number | string | Buffer) => void) => void,
    walk: (oid: string, maxRepetitions: number, walkcb: (varbinds: {oid: string, type: number, value: number | string | Buffer}[]) => void, cb: (err: Error) => void) => void,
    subtree: (oid: string, maxRepetitions: number, walkcb: (varbinds: {oid: string, type: number, value: number | string | Buffer}[]) => void, cb: (err: Error) => void) => void,
}

declare module 'net-snmp' {
    const ErrorStatus: {
        NoError: number,
        TooBig: number,
        NoSuchName: number,
        BadValue: number,
        ReadOnly: number,
        GeneralError: number,
        NoAccess: number,
        WrongType: number,
        WrongLength: number,
        WrongEncoding: number,
        WrongValue: number,
        NoCreation: number,
        InconsistentValue: number,
        ResourceUnavailable: number,
        CommitFailed: number,
        UndoFailed: number,
        AuthorizationError: number,
        NotWritable: number,
        InconsistentName: number,
        [key: number]: string,
    };
    const TrapType: {
        ColdStart: number,
        WarmStart: number,
        LinkDown: number,
        LinkUp: number,
        AuthenticationFailure: number,
        EgpNeighborLoss: number,
        EnterpriseSpecific: number,
        [key: number]: string,
    };
    const ObjectType: {
        Boolean: number,
        Integer: number,
        OctetString: number,
        Null: number,
        OID: number,
        IpAddress: number,
        Counter: number,
        Gauge: number,
        TimeTicks: number,
        Opaque: number,
        Counternumber: number,
        NoSuchObject: number,
        NoSuchInstance: number,
        EndOfMibView: number,
        INTEGER: number,
        'OCTET STRING': number,
        'OBJECT IDENTIFIER': number,
        Integernumber: number,
        Counternumber: number,
        Gaugenumber: number,
        Unsignednumber: number,
        AutonomousType: number,
        DateAndTime: number,
        DisplayString: number,
        InstancePointer: number,
        MacAddress: number,
        PhysAddress: number,
        RowPointer: number,
        RowStatus: number,
        StorageType: number,
        TestAndIncr: number,
        TimeStamp: number,
        TruthValue: number,
        TAddress: number,
        TDomain: number,
        VariablePointer: number,
        [key: number]: string,
    };
    const PduType: {
        GetRequest: number,
        GetNextRequest: number,
        GetResponse: number,
        SetRequest: number,
        Trap: number,
        GetBulkRequest: number,
        InformRequest: number,
        TrapVnumber: number,
        Report: number,
        [key: number]: string,
    };
    const AgentXPduType: {
        Open: number,
        Close: number,
        Register: number,
        Unregister: number,
        Get: number,
        GetNext: number,
        GetBulk: number,
        TestSet: number,
        CommitSet: number,
        UndoSet: number,
        CleanupSet: number,
        Notify: number,
        Ping: number,
        IndexAllocate: number,
        IndexDeallocate: number,
        AddAgentCaps: number,
        RemoveAgentCaps: number,
        Response: number,
        [key: number]: string,
    };
    const MibProviderTypoe: {
        Scalar: number,
        Table: number,
        [key: number]: string,
    };
    const AuthProtocols: {
        none: number,
        md5: number,
        sha: number,
        [key: number]: string,
    };
    const PrivProtocols: {
        none: number,
        des: number,
        aes: number,
        aes256b: number,
        aes256r: number,
        [key: number]: string,
    };
    const SecurityLevel: {
        noAuthNoPriv: number,
        authNoPriv: number,
        authPriv: number,
        [key: number]: string,
    };
    const AccessLevel: {
        None: number,
        ReadOnly: number,
        ReadWrite: number,
        [key: number]: string,
    };
    const MaxAccess: {
        'not-accessible': number,
        'accessible-for-notify': number,
        'read-only': number,
        'read-write': number,
        'read-create': number,
        [key: number]: string,
    };
    const RowStatus: {
        active: number,
        notInService: number,
        notReady: number,
        createAndGo: number,
        createAndWait: number,
        destroy: number,
        [key: number]: string,
    };
    const ResponseInvalidCode: {
        EIpnumberAddressSize: number,
        EUnknownObjectType: number,
        EUnknownPduType: number,
        ECouldNotDecrypt: number,
        EAuthFailure: number,
        EReqResOidNoMatch: number,
        ENonRepeaterCountMismatch: number,
        EOutOfOrder: number,
        EVersionNoMatch: number,
        ECommunityNoMatch: number,
        EUnexpectedReport: number,
        EResponseNotHandled: number,
        EUnexpectedResponse: number,
        [key: number]: string,
    };
    function createV3Session(target: string, cfg: any): SNMPSession;
}