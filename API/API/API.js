/**
 * Created by a on 3/8/2015.
 */

module.exports = function setup(options, imports, register) {

    register(null,{
    API: {

        Originate: function (session, from, to) {




            if(session){

                var ip = session.fsIP;


                /*
                 var params = format('{return_ring_ready=true,Originate_session_uuid={0}{1}',id,'}');
                 var socketdata = format('&socket({0}:{1} async full)', '127.0.0.1',2233);
                 var args = format('{0}user/{1} {2}',params, destination,socketdata);

                 console.log(args);

                 connection.api('originate', args, function(evt){

                 console.log(evt);
                 })

                 */
            }


        }

    }});

}

