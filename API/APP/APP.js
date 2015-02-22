/**
 * Created by a on 2/21/2015.
 */


module.exports = function setup(options, imports, register) {

    var command = imports.Command;
    register(null, {
        APP:{

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
                return command.HangUp();


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