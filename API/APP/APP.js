/**
 * Created by a on 2/21/2015.
 */


var events = require('events');
var eventEmitter = new events.EventEmitter();

module.exports = function setup(options, imports, register) {

    var rest = imports.rest;
    var localVariable = imports.LocalVariable;

    rest.get('/route/:sessionid/:destination', function (req, res, next) {

        eventEmitter.emit('route', req.params.sessionid,req.params.destination);

        res.write("{'message':'hello, world'}");
        res.end();
    });

    var command = imports.Command;
    register(null, {
        APP:{

            Emitter : eventEmitter,

            OnCallRecive : function(session){

                console.log("OnCallRecive" + command);

                return command.Answer();

            },

            OnCallAnswered : function(session){

                console.log("OnCallAnswered");

                //file, noofmindigits, noofmaxdigits, tries, maxtime, tone, invalidfile
                return command.PlayCollect('Duo_IVR_Menu.wav','1','1','3','10','#','invalid.wav');

            },


            OnCallDisconnected: function(session){

                console.log("OnCallDisconnected");

            },

            OnPlayDone : function(session){

                console.log("OnPlayDone");
                //return command.HangUp();


            },


            OnPlayCollectDone : function(session, status, digit ){

                console.log("OnPlayCollectDone "  + digit);
                //return command.HangUp();


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



