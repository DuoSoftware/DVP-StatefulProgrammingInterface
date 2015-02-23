var format = require('stringformat');




module.exports = function setup(options, imports, register) {


    register(null, {
        Command:{

            Answer : function() {

                return  {command: 'answer', arg: ''};

            },

            HangUp : function(){

                return {command: 'hangup', arg: ''};

            },

            PlayCollect : function(file, noofmindigits, noofmaxdigits, tries, maxtime, tone, invalidfile ) {

                //string playCollectCommand = string.Format("sendmsg\ncall-command: execute\nexecute-app-name: play_and_get_digits\nexecute-app-arg: {0} {1} {2} {3} {4} {5} {6} {7} {8}\n\n", 0, a_numOfDig, 1, a_maxTime, tone, fileName, "/invalid.wav", "mydigit", "\\S+");


                var args = format("{0} {1} {2} {3} {4} {5} {6} {7} {8}",noofmindigits,noofmaxdigits, tries ,maxtime, tone, file, invalidfile, "mydigit", "\\S+");

                return event = {command: 'play_and_get_digits', arg: args};

            }
        }
    });

};