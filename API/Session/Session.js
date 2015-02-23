var esl = require('modesl');
var redis = require('redis');
var hashmap = require('hashmap');
var format = require('stringformat');
module.exports = function setup(options, imports, register) {

   // var rest = imports.rest;

    var map = [];

    var connx;
    var app = imports.APP;



    app.Emitter.on('route',function(id, destination){

        console.log(id , destination);
        var connection;


        var cmd;

        function GetElement(element) {
            if (element.id == id) {
                return true;
            } else {
                return false;
            }
        }

        var arrByID = map.filter(GetElement);


        if (arrByID.length > 0) {

            connection = arrByID[0].connection;
        }

        if(connection){

            connection.execute('bridge', format('user/{0}',destination) );
        }


    });


    var esl_server = new esl.Server({port: 2233, myevents:true}, function(){
        console.log("esl server is up");
    });


    var handler =  function(evt, body) {


        var uniqueid = evt.getHeader('Unique-ID');


        var connection;


        var cmd;

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

            console.log(evt.type);

            switch (evt.type) {

                case 'CHANNEL_BRIDGE':

                    break;

                case 'CHANNEL_PARK':

                    break;

                case 'CHANNEL_ANSWER':
                     cmd = app.OnCallAnswered(session);
                    break;

                case 'CHANNEL_UNBRIDGE':

                    break;

                case 'RECV_INFO':

                    break;

                case 'MESSAGE':

                    break;

                case 'DTMF':
                   //cmd = app.OnDTMFRecived(session);
                    break;

                case 'CHANNEL_EXECUTE_COMPLETE':
                    var application = evt.getHeader('Application');
                    var result = evt.getHeader('variable_read_result');
                    var digit =  evt.getHeader('variable_mydigit');


                    if(application && application == 'play_and_get_digits') {

                        if(result && result == 'success' ) {

                            app.OnPlayCollectDone(session,result, digit);
                        }
                        else{

                            app.OnPlayCollectDone(session,'fail', digit);
                        }
                    }




                    //console.log(evt);

                    break;

                case 'PLAYBACK_STOP':

                     //cmd  = app.OnPlayDone(session);

                    break;

                case 'CHANNEL_HANGUP_COMPLETE':

                    //APP.OnCallDisconnected(session);

                    //conn.disconnect();

                    if(connection && connection.connected())
                        connection.disconnect();


                    for(var i = map.length; i--;){
                        if (map[i].id == uniqueid){
                            map.splice(i, 1)

                            break;
                        };
                    }


                    break;

                case 'CHANNEL_HANGUP':
                    var session = { id : uniqueid};
                    app.OnCallDisconnected(session);
                    break;

                case 'RECORD_STOP':

                    //APP.OnRecordDone(session);
                    break;

                default :



                    break;

            }


            if(cmd){

                try {
                   var workingID = connection.execute(cmd.command, cmd.arg)
                    console.log(workingID)
                }
                catch(exp) {

                    console.log(exp);

                }
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