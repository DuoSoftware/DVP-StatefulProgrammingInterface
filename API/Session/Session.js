var esl = require('modesl');
var redis = require('redis');
var hashmap = require('hashmap');


module.exports = function setup(options, imports, register) {

   // var rest = imports.rest;

    var map = [];

    var connx;
    var app = imports.APP;

    var esl_server = new esl.Server({port: 2233, myevents:true}, function(){
        console.log("esl server is up");
    });


    var handler =  function(evt, body) {


        var uniqueid = evt.getHeader('Unique-ID');


        var connection;


        function GetElement(element) {
            if (element.id == uniqueid) {
                return true;
            } else {
                return false;
            }
        }

        var arrByID = map.filter(GetElement);


        if (arrByID.length > 0) {

            connection = arrByID[0].connection;
        }


        if (evt && uniqueid && connection) {


            var session = { id : uniqueid};

            switch (evt.type) {

                case 'CHANNEL_BRIDGE':

                    break;

                case 'CHANNEL_PARK':

                    break;

                case 'CHANNEL_ANSWER':
                    var cmd = app.OnCallAnswered(session);
                    if(cmd){

                        try {
                            connection.execute(cmd.command, cmd.arg)
                        }
                        catch(exp) {

                            console.log(exp);

                        }
                    }

                    break;

                case 'CHANNEL_UNBRIDGE':

                    break;

                case 'RECV_INFO':

                    break;

                case 'MESSAGE':

                    break;

                case 'DTMF':

                    app.OnDTMFRecived(session);
                    break;

                case 'CHANNEL_EXECUTE_COMPLETE':

                    break;

                case 'PLAYBACK_STOP':

                    var cmd  = app.OnPlayDone(session);
                    if(cmd){

                        try {
                            connection.execute(cmd.command, cmd.arg)
                        }
                        catch(exp) {

                            console.log(exp);

                        }
                    }
                    break;

                case 'CHANNEL_HANGUP_COMPLETE':

                    //APP.OnCallDisconnected(session);

                    //conn.disconnect();

                    if(connection && connection.connected())
                        connection.disconnect();

                    break;

                case 'CHANNEL_HANGUP':
                    var session = { id : uniqueid};
                    app.OnCallDisconnected(session);
                    break;

                case 'RECORD_STOP':

                    APP.OnRecordDone(session);
                    break;

                default :

                    console.log(evt.type);

                    break;

            }
        }
    }

    var end =  function(evt, body) {
        this.call_end = new Date().getTime();
        var delta = (this.call_end - this.call_start) / 1000;
        console.log("Call duration " + delta + " seconds");
    }

    var reply =  function(evt, body) {

        console.log("reply " + evt );
    }

    var disconnect =  function(evt, body) {

        var uniqueid = evt.getHeader('Unique-ID');

        //var conn = map[evt.getHeader('Unique-ID')];


    }



    esl_server.on('connection::ready', function(conn, id) {


        //connx = conn;

        var idx  = conn.getInfo().getHeader('Unique-ID');

      //  var idx = id;
        //["Unique-ID"];

            //conn.getInfo()['Unique-ID'];

        map.push({id:idx, connection:conn});

        console.log('new call ' + id);
        conn.call_start = new Date().getTime();



        conn.setAsyncExecute(true);

        //conn.filter("Unique-ID "+ idx);
        conn.subscribe(['CHANNEL_PARK', 'CHANNEL_ANSWER', 'CHANNEL_UNBRIDGE', 'CHANNEL_BRIDGE', 'RECV_INFO', 'MESSAGE', 'DTMF', 'CHANNEL_EXECUTE_COMPLETE', 'PLAYBACK_STOP', 'CHANNEL_HANGUP_COMPLETE', 'RECORD_STOP']);
        conn.send('linger');



        conn.on('esl::end', end);

        conn.on('esl::event::disconnect::notice', disconnect);


        conn.on('esl::event::command::reply', reply);
        conn.on('esl::event::**', handler);

        var session = { id : idx};

        //map.set(conn.getInfo()['Unique-ID'], conn);

        var command = app.OnCallRecive(session);

        conn.execute(command.command);
    });

    register();
};