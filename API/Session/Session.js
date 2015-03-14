var esl = require('modesl');
var format = require('stringformat');
var conf = require('../../config.js');
var request = require('request');

module.exports = function setup(options, imports, register) {

    var sqlite3 = imports.LocalVariable.sqlite3;
    var db = imports.LocalVariable.databse;
    var localVariable = imports.LocalVariable;
    var api = imports.API;


    try {
        db.serialize(function () {
            db.run("CREATE TABLE if not exists Session (CallID TEXT PRIMARY KEY, SessionID, ANI, DNIS, Direction, ChannelStatus)");
            db.run("CREATE TABLE if not exists SessionVariables (SessionID, Key, Value TEXT)");
        });
    }
    catch(ex)
    {}

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

            session = arrByID[0].session;
            connection = arrByID[0].connection;
        }

        if(session){

            /*
            var params = format('{return_ring_ready=true,Originate_session_uuid={0}{1}',id,'}');
            var socketdata = format('&socket({0}:{1} async full)', '127.0.0.1',2233);
            var args = format('{0}user/{1} {2}',params, destination,socketdata);

            console.log(args);

            connection.api('originate', args, function(evt){

                console.log(evt);
            })

            */

            var destination = format("http://{0}:8080/api/originate?", session.fsIP);
            var params = format('{return_ring_ready=true,Originate_session_uuid={0}{1}',id,'}');
            var socketdata = format('&socket({0}:{1} async full)', '127.0.0.1',2233);
            var args = format('{3} {0}user/{1} {2}',params, destination,socketdata, destination);

            console.log(args);

            request(args, function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log(body) // Show the HTML for the Google homepage.
                }
                else{

                     app.OnOriginateFail(session);
                }
            })

        }
    });


    app.Emitter.on('bridge',function(uuid, otheruuid, pbxrequire){

        console.log(uuid , otheruuid);
        var session;
        var connection;


        var otherSession;
        var otherConnection;

        function GetElement(element) {
            if (element.id == uuid) {
                return true;
            } else {
                return false;
            }
        }


        function GetOtherElement(element) {
            if (element.id == otheruuid) {
                return true;
            } else {
                return false;
            }
        }

        var arrByID = map.filter(GetElement);
        var otherArrayById = map.filter(GetOtherElement);

        if (arrByID.length > 0) {

            session = arrByID[0].session;
            connection = arrByID[0].connection;
        }



        if (otherArrayById.length > 0) {

            otherSession = otherArrayById[0].session;
            otherConnection = otherArrayById[0].connection;
        }



        if(session && connection && otherSession && otherConnection && connection.connected() && otherConnection.connected()){

            try {

                if (pbxrequire) {

                    connection.execute('bind_meta_app', '3 ab s execute_extension::att_xfer XML PBXFeatures');
                    connection.execute('bind_meta_app', '4 ab s execute_extension::att_xfer_group XML PBXFeatures');
                    connection.execute('bind_meta_app', '5 ab s execute_extension::att_xfer_speed_dial XML PBXFeatures');
                    connection.execute('bind_meta_app', '6 ab s execute_extension::att_xfer_outbound XML PBXFeatures');
                }


                connection.bgapi('uuid_bridge', format('{0} {1}', uuid, otheruuid), function (evt) {

                    console.log(evt);
                })
            }
            catch(ex){

            }
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



    app.Emitter.on('kill',function(id){

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

            connection.api('uuid_kill', id);
        }
    });

    var esl_server = new esl.Server({port: conf.tcpport, myevents:true}, function(){
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



                    break;

                case 'CHANNEL_HANGUP':
                    try {

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
                    console.log(evt);

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

        console.log( evt );
    }

    var disconnect =  function(evt, body) {

        var uniqueid = evt.getHeader('Controlled-Session-UUID');


        var connection;
        var session;

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


        try{

            if(connection && connection.connected())
                connection.disconnect();


            for(var i = map.length; i--;){
                if (map[i].id == uniqueid){
                    map.splice(i, 1);

                    break;
                };
            }
        }catch(ex){

        }

        if(uniqueid){

            try{
                db.run(format("DELETE FROM Session WHERE CallID = '{0}'", uniqueid));
                localVariable.clear(uniqueid);
            }
            catch(ex){

                console.log(ex);
            }

        }
    }



    esl_server.on('connection::ready', function(conn, id) {

        try {

            var idx = conn.getInfo().getHeader('Unique-ID');
            var from = conn.getInfo().getHeader('Caller-Caller-ID-Number');
            var to = conn.getInfo().getHeader('Caller-Destination-Number');
            var direction = conn.getInfo().getHeader('Call-Direction');
            var channelstatus = conn.getInfo().getHeader('Answer-State');
            var originateSession = conn.getInfo().getHeader('variable_Originate_session_uuid');

            //Core-UUID: 6d2375b0-5183-11e1-b24c-f527b57af954
            //FreeSWITCH-Hostname: freeswitch.local
            //FreeSWITCH-Switchname: freeswitch.local
            //FreeSWITCH-IPv4

            var fsid = conn.getInfo().getHeader('Core-UUID');
            var fsHost = conn.getInfo().getHeader('FreeSWITCH-Hostname');
            var fsName = conn.getInfo().getHeader('FreeSWITCH-Switchname');
            var fsIP = conn.getInfo().getHeader('FreeSWITCH-IPv4');


            var sessionID = idx;

            if(originateSession)
                sessionID = originateSession;


            var session = {id: idx, session: sessionID,  from: from, to: to, direction: direction, channelstatus: channelstatus, fsID: fsid,fsHost: fsHost, fsName: fsName, fsIP: fsIP, myip: conf.externaltcpip, myport: conf.externaltcpport};
            map.push({id: idx, connection: conn, session: session});
            console.log('new call ' + id);
            conn.call_start = new Date().getTime();


            conn.on('esl::end', end);
            conn.on('esl::event::disconnect::notice', disconnect);
            conn.on('esl::event::command::reply', reply);
            conn.on('esl::event::**', handler);

            if(direction == 'outbound'){

                if(channelstatus != 'answered') {

                    conn.execute('wait_for_answer');
                }
            }else{

            }

        }
        catch (ex){}


        try{

            if(originateSession) {

                db.run(format("INSERT INTO Session VALUES ('{0}', '{1}', '{2}', '{3}', '{4}', '{5}')", idx,originateSession, from, to, direction, channelstatus));

            }
            else {

                db.run(format("INSERT INTO Session VALUES ('{0}', '{0}', '{1}', '{2}', '{3}', '{4}')", idx, from, to, direction, channelstatus));

            }
        }
        catch(exp){

            console.log(exp);
        }

        if(!originateSession) {
            var command = app.OnCallRecive(session);
            conn.execute(command.command);
        }else {

            app.OnOutgoingSession(session);
        }
    });

    register();
};