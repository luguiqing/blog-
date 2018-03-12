const	Promise						=	require("bluebird"),
		code						=	require( "./code" ),
		config						=	require( "../global/config" ),
		http						=	require( "./http" ),
		API							=	require( "./api" ),
		log							=	require( "./log" );

module.exports = class {
	/**
	* 验证参数是否为空
	* @version	2017-05-29
	* @param	{array|string}		validArr		验证空的参数名/数组
	* @param	{object}			paramObj		验参的对象
	* @return	{boolean}			是否检测为空
	*/
	validEmpty( validArr, paramObj ){
		if( validArr.length < 1 || validArr === undefined ){
			return true;
		}
		let i, validParam;
		if( typeof validArr === "object" && validArr.length > 0 ){
			for( i = 0; i < validArr.length; i++ ){
				validParam	=	validArr[ i ];
				if( typeof validParam === "string" ){
					if( API.isNull( paramObj[ validParam ] ) ){
						throw new Error( validParam + "|" + code.paramError.code );
					}
				}else{
					if( validParam.premise !== undefined && paramObj[ validParam.premise.name ] === validParam.premise.value && API.isNull( paramObj[ validParam.name ] ) ){
						throw new Error( validParam.name + "|" + code.paramError.code );
					}
				}
			}
		}else if( typeof validArr === "string" ){
			if( API.isNull( paramObj[ validArr ] ) ){
				throw new Error( validArr + "|" + code.paramError.code );
			}
		}
		return true;
	}

	/**
	* 抛出参数错误
	* @version	2017-05-29
	* @param	{string}		name		抛出错误的参数名
	*/
	paramError( name ){
		if( name !== null && name !== undefined ){
			throw new Error( name + "|" + code.paramError.code );
		}
	}

	/**
	* 安全模式
	* @version	2017-05-29
	* @param	{object}		req		request对象
	* @param	{object}		res		response对象
	* @param	{function}		fun		加工方法
	*/
	/**
	* error对象 error.code, error.message, error.stack
	**/
	safeMode( funName, req, res, next ){
		let sendData;
		Promise.try( () => {
			let fun		=	this[ funName ];
			return fun.call( this, req, res, next );
		}).then( result => {
			log.info( result.str + code.success.msg, "Response", req.originalUrl );
			// log.info( JSON.stringify( result.data ), "Response Data", req.originalUrl );
			sendData	=	{
				retcode		:	code.success.code,
				retdata		:	result.data,
				retmsg		:	API.isEmpty( result.str ) ? code.success.msg : result.str
			};
		}).catch( e => {
			let str = "", error, errType;
			if( e.message.indexOf( "|" ) !== -1 ){
				str			=	e.message.split( "|" )[ 0 ];
				e.message	=	Number.parseInt( e.message.split( "|" )[ 1 ] );
			}else{
				e.message	=	Number.parseInt( e.message );
			}

			for( let temp in code ){
				if( code[ temp ].code === e.message ){
					error		=	code[ temp ];
					errType		=	temp;
					break;
				}
			}
			if( error === undefined ){
				log.error( e.stack, "unKnownError", req.originalUrl );
				sendData	=	{
					retcode		:	code.unKnownError.code,
					retmsg		:	code.unKnownError.msg
				};
			}else{
				let stackStr	=	e.stack.split( "at " )[ 1 ].split( "\n" )[ 0 ];
				switch( error.type ){
					case "info":
						log.info( stackStr, errType, req.originalUrl );
						log.info( str + error.msg, errType, req.originalUrl );
					break;

					case "warning":
						log.warning( stackStr, errType, req.originalUrl );
						log.warning( str + error.msg, errType, req.originalUrl );
					break;

					case "error":
						log.error( stackStr, errType, req.originalUrl );
						log.error( str + error.msg, errType, req.originalUrl );
					break;

					default:
						log.warning( stackStr, errType, req.originalUrl );
						log.warning( str + error.msg, errType, req.originalUrl );
					break;
				}
				sendData	=	{
					retcode		:	error.code,
					retmsg		:	str.length === 0 ? error.msg : str
				};
			}
		}).finally( () => {
			res.json( sendData );
			res.end();
		});
	}
};
