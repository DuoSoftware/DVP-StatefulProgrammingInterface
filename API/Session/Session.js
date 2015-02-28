var esl = require('modesl');
var redis = require('redis');
var hashmap = require('hashmap');
var format = require('stringformat');




module.exports = function setup(options, imports, register) {

    var sqlite3 = imports.LocalVariable.sqlite3;
   var db = imports.LocalVariable.databse;
    var localVariable = imports.LocalVariable;


    try {
        db.serialize(function () {
            db.run("CREATE TABLE if not exists Session (CallID TEXT PRIMARY KEY, SessionID, ANI, DNIS, Direction, ChannelStatus)");
        });
    }
    catch(ex)
    {

    }


    var map = [];
    var connx;
    var app = imports.APP;



    app.Emitter.on('route',function(id, destination){

        console.log(id , destination);
        var connection;


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


    app.Emitter.on('originate',function(id, destination){

        console.log(id , destination);
        var session;




        function GetElement(element) {
            if (element.id == id) {
                return true;
            } else {
                return false;
            }
        }

        var arrByID = map.filter(GetElement);


        if (arrByID.length > 0) {

            session = arrByID[0].session;
        }

        if(session){

            //connection.execute('bridge', format('user/{0}',destination) );
        }


    });

    app.Emitter.on('hangup',function(id){

        console.log(id );
        var connection;


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

            connection.execute('hangup');
        }



    });





    var esl_server = new esl.Server({port: 2233, myevents:true}, function(){
        console.log("esl server is up");
    });


    var handler =  function(evt, body) {


        var uniqueid = evt.getHeader('Unique-ID');


        var connection;
        var session;


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
            session = arrByID[0].session;
        }


        if (evt && uniqueid && connection) {


           // var session = { id : uniqueid};

            console.log(evt.type);

            switch (evt.type) {

                case 'CHANNEL_BRIDGE':

                    try {
                        cmd = app.OnBridge(session);
                    }
                    catch(ex){

                    }

                    break;

                case 'CHANNEL_PARK':
                    try {
                        cmd = app.OnPark(session);
                    }
                    catch(ex) {

                    }

                    break;

                case 'CHANNEL_ANSWER':

                    try {
                        cmd = app.OnCallAnswered(session);

                        //UPDATE table_name where condition

                        try{
                            db.run(format("UPDATE Session SET ChannelStatus = 'answered' WHERE CallID = '{0}'", uniqueid));

                        }
                        catch(ex){

                            console.log(ex);
                        }
                    }
                    catch (ex){

                    }
                    break;

                case 'CHANNEL_UNBRIDGE':

                    try {
                        cmd = app.OnUnbridge(session);
                    }
                    catch(ex){

                    }

                    break;

                case 'RECV_INFO':

                    try {
                        cmd = app.OnInfo(session);
                    }
                    catch(ex){

                    }

                    break;

                case 'MESSAGE':

                    try {
                        cmd = app.OnMessage(session);
                    }
                    catch(ex){

                    }

                    break;

                case 'DTMF':
                    try {
                        cmd = app.OnDTMFRecived(session);
                    }
                    catch(ex){

                    }
                    break;

                case 'CHANNEL_EXECUTE_COMPLETE':

                    try {
                        var application = evt.getHeader('Application');
                        var result = evt.getHeader('variable_read_result');
                        var digit = evt.getHeader('variable_mydigit');


                        if (application && application == 'play_and_get_digits') {

                            if (result && result == 'success') {

                                cmd = app.OnPlayCollectDone(session, result, digit);
                            }
                            else {

                                cmd = app.OnPlayCollectDone(session, 'fail', digit);
                            }
                        }
                    }catch (ex){

                    }


                    break;

                case 'PLAYBACK_STOP':
                    try {

                        cmd = app.OnPlayDone(session);
                    }
                    catch(ex){

                    }

                    break;

                case 'CHANNEL_HANGUP_COMPLETE':

                    if(connection && connection.connected())
                        connection.disconnect();


                    for(var i = map.length; i--;){
                        if (map[i].id == uniqueid){
                            map.splice(i, 1)

                            break;
                        };
                    }

                    try{
                        db.run(format("DELETE FROM Session WHERE CallID = '{0}'", uniqueid));
                        localVariable.clear(uniqueid);
                    }
                    catch(ex){

                        console.log(ex);
                    }

                    break;

                case 'CHANNEL_HANGUP':
                    try {
                        var session = {id: uniqueid};
                        app.OnCallDisconnected(session);
                    }
                    catch(ex){


                    }
                    break;

                case 'RECORD_STOP':

                    try {

                        cmd = app.OnRecordDone(session);
                    }
                    catch(ex){

                    }
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

        try {

            //connx = conn;

            //CallID TEXT PRIMARY KEY, SessionID, From, To, Direction, ChannelStatus TEXT
            var idx = conn.getInfo().getHeader('Unique-ID');
            var from = conn.getInfo().getHeader('Caller-Caller-ID-Number');
            var to = conn.getInfo().getHeader('Caller-Destination-Number');
            var direction = conn.getInfo().getHeader('Call-Direction');
            var channelstatus = conn.getInfo().getHeader('Answer-State');
            var session = {id: idx, from: from, to: to, direction: direction, channelstatus: channelstatus};

            map.push({id: idx, connection: conn, session: session});
            console.log('new call ' + id);
            conn.call_start = new Date().getTime();
            conn.setAsyncExecute(true);
            conn.subscribe(['CHANNEL_PARK', 'CHANNEL_ANSWER', 'CHANNEL_UNBRIDGE', 'CHANNEL_BRIDGE', 'RECV_INFO', 'MESSAGE', 'DTMF', 'CHANNEL_EXECUTE_COMPLETE', 'PLAYBACK_STOP', 'CHANNEL_HANGUP_COMPLETE', 'RECORD_STOP']);
            conn.send('linger');
            conn.on('esl::end', end);
            conn.on('esl::event::disconnect::notice', disconnect);
            conn.on('esl::event::command::reply', reply);
            conn.on('esl::event::**', handler);
        }
        catch (ex){



        }


        try{
            db.run(format("INSERT INTO Session VALUES ('{0}', '{0}', '{1}', '{2}', '{3}', '{4}')", idx, from, to, direction, channelstatus));
        }
        catch(exp){

            console.log(exp);
        }

        var command = app.OnCallRecive(session);
        conn.execute(command.command);
    });

    register();
};