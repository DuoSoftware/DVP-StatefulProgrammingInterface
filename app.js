

/*
var esl_server = new esl.Server({port: 8085, myevents:true}, function(){
    console.log("esl server is up");
});


var handler =  function(evt, body) {
    this.call_end = new Date().getTime();
    var delta = (this.call_end - this.call_start) / 1000;
    console.log("Call duration " + delta + " seconds");
}

var end =  function(evt, body) {
    this.call_end = new Date().getTime();
    var delta = (this.call_end - this.call_start) / 1000;
    console.log("Call duration " + delta + " seconds");
}



esl_server.on('connection::ready', function(conn, id) {
    console.log('new call ' + id);
    conn.call_start = new Date().getTime();


    conn.setEventLock(true);
    conn.exec('myevents');
    conn.events('json', 'CHANNEL_PARK CHANNEL_ANSWER CHANNEL_UNBRIDGE CHANNEL_BRIDGE RECV_INFO MESSAGE DTMF CHANNEL_EXECUTE_COMPLETE PLAYBACK_STOP CHANNEL_HANGUP_COMPLETE RECORD_STOP')
    conn.exec('linger');
    conn.setEventLock(false);


    conn.on('esl::end', handler);
    conn.on('esl::event::**', end);
});

*/


var path = require('path');
var architect = require("architect");

var configPath = path.join(__dirname, "config.js");
var config = architect.loadConfig(configPath);

architect.createApp(config, function (err, app) {
    if (err) {
        throw err;
    }
    console.log("app ready");
});

