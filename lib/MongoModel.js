const	Promise		=	require("bluebird"),
		mongoDB		=	require( "./mongodb" ),
		log			=	require("./log"),
		code		=	require("./code");

module.exports	=	class {
	/**
	* 获取写入用mongodb连接
	* @memberof	Model
	* @version		2017-05-27
	* @return		{object}	connection
	*/
	getCollection(){
		return mongoDB.getConnection().then( connection => {
			return connection.collection( this.collection );
		}).catch( e => {
			log.error( "get collection error : " + e.message, "Mongo" );
			throw new Error( code.dbSysError.code );
		});
	}

	/**
	* 获取新增用的对象（包含默认值）
	* @version	2017-05-27
	* @param	{object}	obj		对象的值
	* @return	{object}
	*/
	getNewObject( obj, _id ){
		let newObj	=	mergeObj( this.struct, obj, "Root" );
		newObj._id	=	_id;
		return newObj;
	}


	/**
	* 获取更新用的对象（包含默认值）
	* @version	2017-05-27
	* @param	{string}	name	对象名称
	* @param	{object}	obj		对象的值
	* @param	{string}	type	类型
	* @return	{object}
	*/
	getUpdateObject( name, obj, type ){
		let arr, temp, reg, rootName;
		rootName	=	"Root";
		//匹配1，-1， 19这样的数字，mongodb原生操作部分数组是用arr.$.key或者arr.0.key
		reg			=	/^-?[0-9]\d*$/;
		if( name.indexOf( "." ) !== -1 ){
			arr		=	name.split( "." );
		}else{
			arr		=	[ name ];
		}
		temp	=	this.struct;
		arr.forEach( o => {
			rootName	=	o;
			if( temp.length !== undefined && ( o === "$" || reg.test( o ) ) ){
				temp	=	temp[ 0 ];
			}else{
				temp	=	temp[ o ];
			}
		});
		switch( type ){
			case "push":
				if( temp.length !== undefined ){
					temp	=	temp[ 0 ];
				}
			break;

			default:
			break;
		}
		return mergeObj( temp, obj, rootName );
	}


	/**
	* 查询数据
	* @version	2017-05-27
	* @param	{object}	where	查询条件
	* @param	{array}		field	查询字段，
	* eg [0,"name", ...field],默认field为要查找字段，可往数组加0变为默认不显示
	* @param	{object}	order	排序字段
	* eg {
	* 		"_id" :  Number,//-1为降序，1为升序
	*    }
	* @param	{object}	limit	查询范围
	* eg{
	* 		min :  Number,//跳过多少项
	*		num :  Number,//查询多少条数据
	*	}
	* @type		{function({where:object,field:array,order:object,limit:object}):Array<object>}
	*/
	select({ where = {}, field = [], order = {}, limit = {} }){
		return this.getCollection().then( collection => {
			let fieldObj	=	{},
				fieldFlag	=	1,
				result;
			if( field.length > 0 ){
				if( typeof field[ 0 ] === "number" ){
					fieldFlag	=	field[ 0 ];
					field.splice( 0, 1 );
				}
				field.forEach( obj => {
					fieldObj[ obj ]	=	fieldFlag;
				});
			}
			result	=	collection.find( where, fieldObj ).sort( order );
			if( limit.min !== undefined ){
				result	=	result.skip( limit.min ).limit( limit.num );
			}
			log.info( "select " + this.collection + " : " + JSON.stringify({
				where	:	where,
				field	:	fieldObj,
				order	:	order,
				limit	:	limit
			}), "Mongo" );
			return result.toArray();
		}).catch( e => {
			log.error( "select error : " + e.message, "Mongo" );
			throw new Error( code.dbSysError.code );
		});
	}

	/**
	* 新增数据
	* @version	2017-05-27
	* @param	{object}	object	新增数据对象,数组则是插入多条
	* @return	{number}
	*/
	insert( object = {} ){
		return mongoDB.getConnection().then( connection => {
			return connection.collection( "other.ids" ).findAndModify({
				_id			:	this.collection
			}, [], {
				$inc		:	{
					value		:	object.length === undefined ? 1 : object.length
				}
			}, {
				upsert		:	true,
				new			:	true
			}).then( result => {
				let value, collection;
				value	=	result.value.value;
				if( object.length !== undefined ){
					let arr = [], num = value - object.length + 1;
					object.forEach( ( o, i ) => {
						arr.push( this.getNewObject( o, num + i ) );
					});
					object	=	arr;
					collection	=	connection.collection( this.collection ).insertMany( arr );
				}else{
					collection	=	connection.collection( this.collection ).insertOne( this.getNewObject( object, value ) );
				}
				log.info( "insert " + this.collection + " : " + JSON.stringify( object ), "Mongo" );
				return collection.then( result => {
					log.info( "insert " + this.collection + " : " + JSON.stringify( result ), "Mongo" );
					return result.insertedId === undefined ? result.insertedIds : result.insertedId;
				});
			});
		}).catch( e => {
			log.error( "insert error : " + e.message, "Mongo" );
			throw new Error( code.dbSysError.code );
		});
	}

	/**
	* 更新数据
	* @version	2017-05-27
	* @param	{object}	where		筛选项
	* @param	{object}	obj			更新对象
	* @param	{object}	fullObj		完整更新对象(mongodb)
	* @param	{object}	opt			配置项(mongodb)
	* @type	{function({where:object,obj:object,fullObj:object,opt:object}):number}
	*/
	update({ where = {}, obj, fullObj, opt = {} }){
		return this.getCollection().then( collection => {
			let updateObj;
			if( obj === undefined ){
				if( fullObj.$push !== undefined ){
					//这里对数组的$push进行额外的处理，对于其他的实例属性并没有，因为更新时，数组里有些是有默认值的，所以还是调用到mergeObj()
					for( let temp in fullObj.$push ){
						if( fullObj.$push[ temp ].$each !== undefined ){
							let temp2	=	[];
							fullObj.$push[ temp ].$each.forEach( o => {
								temp2.push( this.getUpdateObject( temp, o, "push" ) );
							});
							fullObj.$push[ temp ].$each		=	temp2;
						}else{
							fullObj.$push[ temp ]	=	this.getUpdateObject( temp, fullObj.$push[ temp ], "push" );
						}
					}
				}
				//对$set对象校验type类型
				if( fullObj.$set !== undefined && typeof fullObj.$set === "object" ){
					for( let temp in fullObj.$set){
						fullObj.$set[ temp ] = this.getUpdateObject( temp, fullObj.$set[ temp ]);
					}
				}
				updateObj	=	fullObj;
			}else{
				for( let temp in obj ){
					//这里的主要目的是检验更新的值的类型
					obj[ temp ]	=	this.getUpdateObject( temp, obj[ temp ] );
				}
				updateObj	=	{
					$set	:	obj
				};
			}
			log.info( "update " + this.collection + " : " + JSON.stringify({
				where		:	where,
				updateObj	:	updateObj,
				opt			:	opt
			}), "Mongo" );
			return collection.updateMany( where, updateObj, opt ).then( result => {
				log.info( "update " + this.collection + " : " + JSON.stringify( result ), "Mongo" );
				return result.result.nModified;
			});
		}).catch( e => {
			log.error( "update error : " + e.message, "Mongo" );
			throw new Error( code.dbSysError.code );
		});
	}

	/**
	* 删除数据
	* @version	2017-05-27
	* @param	{object}	where	删除条件
	* @param	{object}	opt		配置选项
	* @return	{number}
	*/
	delete( where = {}, opt = {} ){
		return this.getCollection().then( collection => {
			log.info( "delete " + this.collection + " : " + JSON.stringify({
				where	:	where,
				opt		:	opt
			}), "Mongo" );
			return collection.deleteMany( where, opt ).then( result => {
				log.info( "delete " + this.collection + " : " + JSON.stringify( result ), "Mongo" );
				return result.deletedCount;
			});
		}).catch( e => {
			log.error( "delete error : " + e.message, "Mongo" );
			throw new Error( code.dbSysError.code );
		});
	}
}

/**
* 将默认信息合并入对象，涉及到递归遍历数据对象
* 注意： 这里的实现方式决定了this.struct对象的一级属性type不能直接定义为type : Number；
* 不然Number是构造函数，会直接把newObj整个对象传到dealValue函数造成typeErr
* @version	2017-05-27
* @param	{object}	oldObj		旧对象
* @param	{object}	newObj		新对象
* @return	{object}
*/
/*
	this.struct = {
		example		:	[
			{
				totalPrice		:	{
					type			:	Number,
					required		:	true,
					default 		:   10
				},
				date			:	{
					type			:	Date,
					default			:	Date.now,
					required		:	true
				}
			}
		]
	}
*/
function mergeObj( struct, newObj, name ){
	let newObject;
	if( typeof struct === "object" ){
		if( struct.type !== undefined && typeof struct.type === "function" ){
			//通常是js的类型: String, Number,Boolean等
			newObject		=	dealValue( struct.type, newObj, name, struct.required, struct.default );
		}else if( struct.length !== undefined && typeof struct.length === "number" ){
			//用于插入数组类型文档
			newObject	=	[];
			if( newObj === null || newObj === undefined ){
				newObj	=	[];
			}
			//model中struct.length 为 1
			newObj.forEach( o => {
				newObject.push( mergeObj( struct[ 0 ], o ) );
			});
		}else{
			if( newObj === null ){
				newObject	=	null;
			}else{
				newObject	=	{};
				if( newObj === null || newObj === undefined ){
					newObj		=	{};
				}
				for( let temp in struct ){
					newObject[ temp ]	=	mergeObj( struct[ temp ], newObj[ temp ], temp );
				}
				for( let temp in newObj ){
					if( struct[ temp ] === undefined ){
						newObject[ temp ]	=	newObj[ temp ];
					}
				}
			}
		}
	}else if( typeof struct === "function" ){
		newObject	=	dealValue( struct, newObj, name );
	}else{
		log.error( "mergeObj structError : " + name, "Mongo" );
		throw new Error();
	}
	return newObject;
}

/**
* 处理目标对象的值
* @version	2017-08-02
* @param	{function}	type				对象类型的构造函数
* @param	{object}	value				对象值
* @param	{string}	name				对象的名称
* @param	{boolean}	required			是否必填
* @param	{object}	defaultValue		对象的默认值
* @return	{object}
*/
function dealValue( Type, value, name, required, defaultValue ){
	let typeName, result;
	//typeName 通常为string，date，number等js基本数据类型，如果是时间，传入的是时间戳Date.now();
	typeName	=	Type.name.toLowerCase();
	if( value !== undefined && value !== null ){
		if( ( typeName !== "date" && typeof value !== typeName ) || ( typeName === "date" && typeof value !== "number" ) ){
			log.error( "mergeObj typeError : " + name, "Mongo" );
			throw new Error();
		}
	}else{
		if( value === undefined ){
			if( required && defaultValue === undefined ){
				log.error( "mergeObj requiredError : " + name, "Mongo" );
				throw new Error();
			}
			if( required ){
				value		=	typeof defaultValue === "function" ? defaultValue() : defaultValue;
			}
		}
	}
	if( value !== undefined && value !== null ){
		switch( typeName ){
			case "date":
				result	=	value ? new Type( value ) : new Type();
			break;

			default:
				result	=	value ? Type( value ) : Type();
			break;
		}
	}else{
		result	=	value;
	}
	return result;
}