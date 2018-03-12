const	_			=	require( "lodash" ),
		moment		=	require( "moment" ),
		crypto		=	require( "crypto" );

module.exports	=	class {
	/**
	* 检测对象是否为null或undefined
	* @param	{any}		obj		检测对象
	* @return	{boolean}			对象是否为空
	*/
	static isNull( obj ){
		return _.isNull( obj ) || _.isUndefined( obj );
	}

	/**
	* 检测对象内部是否为空数组空对象等
	* @param	{object}	obj		检测对象
	* @return	{boolean}			对象是否为空
	*/
	static isEmpty( obj ){
		switch( typeof obj ){
			case "boolean":
				return false;

			case "number":
				return false;

			default:
				return _.isEmpty( obj );
		}
	}
}