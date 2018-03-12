const 	MongoClient = 	require('mongodb').MongoClient,
		Promise		=	require("bluebird"),
		log 		= 	require('../lib/log'),
		config 		= 	require('../global/config');

let connection;

module.exports = class {
	/**
	* 获取写入连接,没有加入密码验证
	* @return	{object}	mongoDB的连接
	*/
	static getConnection(){
		if(connection !== undefined){
			return Promise.resolve(1).then( result => {
				return connection;
			});
		}else{
			return MongoClient.connect( "mongodb://" + config.dbConfig.host + ":" + config.dbConfig.port, {
				poolSize		:	50,
				promiseLibrary	:	Promise,
				reconnectTries	:	60
			}).then( client => {
				connection	=	client.db(config.dbConfig.database);
				return connection;
			}).catch( err => {
				log.error( "Cannot get connection : " + err.message, "Mongo" );
				throw err;
			});
		}
	}
}