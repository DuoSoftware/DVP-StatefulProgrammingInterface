module.exports = [{
    packagePath: "architect-restify",
    port: process.env.PORT || 8080,
    host: process.env.IP || "0.0.0.0"
},
    './API/Session',
    './API/Command',
    './API/APP',
    './API/LocalVariable'];
