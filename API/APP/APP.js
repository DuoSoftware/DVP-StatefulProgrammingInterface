/**
 * Created by a on 2/21/2015.
 */


var events = require('events');
var eventEmitter = new events.EventEmitter();
var Client = require('node-rest-client').Client;//https://www.npmjs.com/package/node-rest-client
var restclient = new Client();

module.exports = function setup(options, imports, register) {

    var rest = imports.rest;
    var localVariable = imports.LocalVariable;
    var db = localVariable.databse;

    try {
        db.serialize(function () {
            db.run("CREATE TABLE if not exists Queue (QID, QMusic, HoldMusic, PRIMARY KEY(QID))");
        });
    }
    catch(ex){

    }

    rest.get('/route/:sessionid/:destination', function (req, res, next) {

        eventEmitter.emit('route', req.params.sessionid,req.params.destination);

        res.write("{'message':'hello, world'}");
        res.end();
    });


    rest.get('/hangup/:sessionid', function (req, res, next) {

        eventEmitter.emit('hangup', req.params.sessionid);

        res.write("{'message':'hello, world'}");
        res.end();
    });


    rest.get('/originate/:sessionid/:destination', function (req, res, next) {

        eventEmitter.emit('originate', req.params.sessionid,req.params.destination);

        res.write("{'message':'hello, world'}");
        res.end();
    });

    var command = imports.Command;
    register(null, {
        APP:{

            Emitter : eventEmitter,

            OnOutgoingSession : function(session) {

              console.log(session.session, session.id)
            },

            OnCallRecive : function(session){

                console.log("OnCallRecive" + command);
                return command.Answer();
            },

            OnCallAnswered : function(session){

                var cmd = command.Stream("default");
                if(session.id != session.session){

                    cmd = null;

                    eventEmitter.emit('bridge', session.id, session.session, true);

                }
                console.log("OnCallAnswered");
                return cmd;
                    //PlayCollect('Duo_IVR_Menu.wav','1','1','3','10','#','invalid.wav');
            },

            OnCallDisconnected : function(session){

                console.log("OnCallDisconnected");
            },

            OnPlayDone : function(session){

                console.log("OnPlayDone");
            },

            OnPlayCollectDone : function(session, status, digit ){

                console.log("OnPlayCollectDone "  + digit);
            },

            OnDTMFRecived : function(session){

                console.log("OnDTMFRecived");
            },

            OnRecordDone : function(session){

                console.log("OnRecordDone");
            }
        }
    });
};

//module.exports.eventEmitter = eventEmitter;



