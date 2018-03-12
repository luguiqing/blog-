const	config				=	require( "../global/config" );

switch( config.database ){
	case "mongodb":
		module.exports	=	require( "./MongoModel" );
	break;

	case "mysql":
		module.exports	=	require( "./MysqlModel" );
	break;

	default:
		module.exports	=	require( "./MongoModel" );
	break;
}
