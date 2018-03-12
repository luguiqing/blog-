const	Promise				=	require("bluebird"),
		urlParser			=	require("url"),
		path				=	require("path"),
		fs					=	Promise.promisifyAll( require("fs") ),
		querystring			=	require("querystring"),
		mimes				=	require("./mimes.json"),
		http				=	require("http"),
		https				=	require("https"),
		log					=	require("./log"),
		API					=	require("./api"),
		code				=	require("./code");

module.exports	=	class {
	/**
	 * GET请求
	 * @param	{string}	url				请求URL
	 * @param	{object}	data			请求数据``
	 * @param	{object}	options			配置参数
	 */
	static get( url, data = {}, options = {} ){
		return this.request( url, "GET", data, options );
	}

	/**
	 * POST请求
	 * @param	{string}	url				请求URL
	 * @param	{object}	data			请求数据
	 * @param	{object}	options			配置参数
	 */
	static post( url, data = {}, options = {} ){
		return this.request( url, "POST", data, options );
	}

	/**
	 * GET请求
	 * @param	{string}	url							请求URL
	 * @param	{string}	type						请求类型
	 * @param	{object}	data						请求数据
	 * @param	{object}	options						配置参数
	 * @param	{string}	options.contentType			请求数据格式
	 *                                       			json	-	发送JSON格式的信息
	 *                                       			multi	-	发送二进制信息
	 *                                       			null	-	不写明发送信息格式
	 * @param	{string}	options.resultType			返回数据类型
	 *                                      			json	-	自动返回信息JSON.parse()
	 *                                      			body	-	response的body
	 *                                      			full	-	包括返回的header等信息
	 *                                      			buffer	-	返回二进制Buffer
	 */
	static request( url, type = "GET", data = {}, options = {} ){
		options.contentType	=	options.contentType ? options.contentType : "json";
		options.resultType	=	options.resultType ? options.resultType : "json";
		let httpClient, httpOptions, headers;
		url		=	urlParser.parse( url );
		switch( url.protocol ){
			case "http:":
				httpClient	=	http;
				url.port	=	url.port === null ? 80 : url.port;
			break;

			case "https:":
				httpClient	=	https;
				url.port	=	url.port === null ? 443 : url.port;
			break;

			default:
				httpClient	=	http;
		}
		if( type === "GET" ){
			let query	=	querystring.parse( url.query );
			for( let temp in data ){
				query[ temp ]	=	data[ temp ];
			}
			query			=	querystring.stringify( query );
			url.pathname	+=	"?" + query;
			data			=	null;
			headers			=	{
				"Content-Length"	:	0
			};
		}else if( type === "POST" ){
			if( !API.isNull( url.query ) ){
				url.pathname	+=	"?" + url.query;
			}
			headers			=	{};
			switch( options.contentType ){
				case "json":
					headers[ "Content-Type" ]	=	"application/json";
					data						=	JSON.stringify( data );
				break;

				case null:
				break;

				case "multi":
					let boundary =	"--KNodeForm" + ( Math.random() * 9007199254740992 ).toString( 36 );
					headers[ "Content-Type" ]	=	"multipart/form-data; boundary=" + boundary;

					let suffix, file, buff;
					buff 		=	Buffer.alloc();
					if( data.file ){
						for( let temp in data.file ){
							file	=	data.file[ temp ];
							suffix	=	path.extname( file );
							suffix	=	suffix.substring( 1, suffix.length );
							buff 	=	Buffer.concat([
								buff,
								Buffer.from( "\r\n--" + boundary + "\r\n" +
											'Content-Disposition: form-data; name="' + temp + '"; filename="' + path.basename( file ) + '"\r\n' +
											"Content-Type: " + mimes[ suffix ] + "\r\n\r\n" ),
								fs.readFileSync( file )
							]);
						}
					}
					if( data.param ){
						for( let temp in data.param ){
							buff 	=	Buffer.concat([
								buff,
								Buffer.from( "\r\n--" + boundary + "\r\n" +
											'Content-Disposition: form-data; name="' + temp + '"\r\n\r\n' + data.param[ temp ] )
							]);
						}
					}
					data 	=	Buffer.concat([
									buff,
									Buffer.from( "\r\n--" + boundary + "--" )
								]);
				break;

				default:
					headers[ "Content-Type" ]	=	"application/json";
					data						=	JSON.stringify( data );
			}
			headers[ "Content-Length" ]		=	Buffer.byteLength( data );
		}

		httpOptions = {
			hostname	:	url.hostname,
			port		:	url.port,
			path		:	url.pathname,
			method		:	type,
			encoding	:	"utf-8",
			headers		:	headers
		};
		if( url.port !== null ){
			httpOptions.port	=	url.port;
		}else{
			httpOptions.port	=	80;
		}

		log.info( "request options : " + JSON.stringify( httpOptions ), "Http" );
		return new Promise( ( resolve, reject ) => {
			let request = httpClient.request( httpOptions, function( response ){
				if( response.statusCode !== 200 ){
					reject( new Error( "httpReuest error, status : " + response.statusCode ) );
				}
				let result, buf, bufArr, bufLen;
				result	=	{
					httpVersion		:	response.httpVersion,
					httpStatusCode	:	response.statusCode,
					headers			:	response.headers,
					body			:	"",
					trailers		:	response.trailers
				};
				bufArr	=	[];
				bufLen	=	0;
				return response.on( "data", function( chunk ){
					bufArr.push( chunk );
					bufLen	+=	chunk.length;
				}).on( "end", function(){
					try{
						buf		=	Buffer.alloc( bufLen );
						for( let i = 0, pos = 0; i < bufArr.length && pos < bufLen; i++ ){
							bufArr[ i ].copy( buf, pos );
							pos		+=	bufArr[ i ].length;
						}
						switch( options.resultType ){
							case "json":
								resolve( JSON.parse( buf.toString() ) );
							break;

							case "buffer":
								resolve( buf );
							break;

							case "body":
								resolve( buf.toString() );
							break;

							case "full":
								result.body		=	buf.toString();
								resolve( result );
							break;

							default:
								resolve( JSON.parse( buf.toString() ) );
							break;
						}
					}catch( e ){
						reject( e );
					}
				});
			});

			request.on( "error", error => {
				log.error( "request : " + error.message, "Http" );
				reject( error );
			});

			if( data !== null ){
				request.write( data );
			}

			request.end();
		}).catch( e => {
			log.error( e.message, "Http" );
			throw new Error( code.httpError.code );
		});
	}
};
