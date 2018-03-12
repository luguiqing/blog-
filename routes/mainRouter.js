const	express					=	require("express"),
		log						=	require("../lib/log"),
		mongo 					= 	require("../lib/mongodb"),
		userRouter 				= 	require("./userRouter"),
		articleRouter 			= 	require("./articleRouter"),
		router					=	express.Router();

router.all( "/*", ( req, res, next ) => {
	let logObj = {}, signObj = {}, temp;
	for( temp in req.body ){
		if( typeof req.body[ temp ] !== "string" || req.body[ temp ].length < 200 ){
			logObj[ temp ]		=	req.body[ temp ];
			signObj[ temp ]		=	req.body[ temp ];
		}else{
			logObj[ temp ]		=	"数据过长不展示";
		}
	}
	log.info( JSON.stringify({
		url		:	req.originalUrl,
		method	:	req.method,
		params	:	logObj
	}), "Request", req.originalUrl );
	next();
});

router.use("/user", userRouter);

router.use("/article", articleRouter);


module.exports	=	router;