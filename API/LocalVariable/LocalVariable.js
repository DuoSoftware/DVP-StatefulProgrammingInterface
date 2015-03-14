var sqlite3 = require('sqlite3').verbose();
var format = require('stringformat');
var redis = require('redis');


module.exports = function setup(options, imports, register) {

    var db = new sqlite3.Database('config.db');//:memory:



    register(null, {LocalVariable:{


        databse : db,
        sqlite3 : sqlite3,


        get: function (sessionID, key, cb){

            if(cb) {

                var query = format("SELECT Value from SessionVariables WHERE SessionID = '{0}' AND Key = '{1}'",sessionID, key);

                db.get(query,function (row, err) {

                    if(!err) {
                        cb(row.value);
                    }else{

                        cb(null);
                    }

                });
            }
        },

        set: function(sessionID, key, value){

            //db.run("INSERT into table_name(col1,col2,col3) VALUES (val1,val2,val3)");

            db.run(format("INSERT into SessionVariables VALUES ('{0}', '{1}', '{2}')",sessionID, key, value));


        },

        clear : function (sessionID){

            //"DELETE * from table_name where condition")

            db.run(format("DELETE from SessionVariables WHERE SessionID = '{0}'",sessionID));

        }
    }});

}