module.exports = [{
    packagePath: "architect-restify",
    port: process.env.PORT || 8090,
    tcpport: process.env.TCPPORT || 2233,
    externaltcpip: process.env.EXTERNALTCPIP || '127.0.0.1',
    externaltcpport: process.env.EXTERNALTCPPORT || 2233,
    host: process.env.IP || "0.0.0.0"
},
    './API/Session',
    './API/Command',
    './API/APP',
    './API/LocalVariable',
    './API/API'];
