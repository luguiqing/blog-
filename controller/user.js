const 	Controller  	= 		require("../lib/Controller");
const 	md5 			= 		require('md5');
const 	moment 			= 		require('moment');
const 	articleModel  	= 		require("../model/article.info");
const 	userModel  		= 		require("../model/user.info");
const 	file  			= 		require("../lib/file");




module.exports = new class extends Controller{
	register( req ){
		this.validEmpty(["userName", "password"], req.body);

		let salt = Math.floor(Math.random() * 900000 + 100000);
		return userModel.select({
			where 	   		: 	{
				userName 	: 	req.body.userName
			}
		}).then( result => {
			if(result.length > 0){
				this.paramError("用户名已经被使用")
			}

			let createDate	=	Date.now();
			return userModel.insert({
				'userName' 		: 		req.body.userName,
				'password'		: 		md5(salt + req.body.password + createDate),
				'createDate' 	: 		createDate,
				'salt' 			: 		salt
			})

		}).then( result => {
			return userModel.select({
				where   : 	{
					_id :   result
				},
				field 	: 	["userName", "auth", "avatar", "des", "_id"]
			})
		}).then( result => {
			//token在中间层补充
			return{
				data :   result[0],
				str  :   "注册成功"
			}
		})
	}

	login( req ){
		this.validEmpty(["userName", "password"], req.body);

		return userModel.select({
			where 	   		: 	{
				userName 	: 	req.body.userName,
				status 		: 	'1'
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError("用户不存在或者被冻结")
			}
			result = result[0];
			let temp = md5(result.salt + req.body.password + new Date(result.createDate).getTime());

			if(temp !== result.password){
				this.paramError("密码错误")
			}
			return{
				data :   result,
				str  :   "登录成功"
			}
		})
	}

	editUserInfo( req ){
		//console.log(req.session.token);
		return{
			data :   "req",
			str  :   "登录成功"
		}
	}
	//管理员冻结或者解冻用户
	changeUserStatus( req ){
		//注意status是字符串,1为正常，2为冻结
		this.validEmpty(["userId", "adminId", "status"], req.body);

		return userModel.select({
			where 	   : 		{
				_id    : 	 req.body.adminId,
				status : 	 '1',
				auth   :  	 2
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError("没有权限");
			}

			return userModel.update({
				where  		: 		{
					_id 	: 		req.body.userId
				},
				obj 		: 		{
					status 	: 		req.body.status
				}
			})
		}).then( result => {
			return{
				data : result,
				str  : "更改用户状态成功"
			}
		})
	}
	//获取用户列表
	getUserList( req ){
		//注意status是字符串,1为正常，2为冻结
		this.validEmpty(["userId"], req.body);

		return userModel.select({
			where 	   : 		{
				_id    : 	 req.body.userId,
				status : 	 '1',
				auth   :  	 2
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError("没有权限");
			}

			return userModel.select({});
		}).then( result => {
			return{
				data : result,
				str  : "获取用户成功"
			}
		})
	}

	//管理员强制删除用户
	forceDeleteUser( req ){
		this.validEmpty(["userId", "adminId"], req.body);
		let user;
		return userModel.select({
			where 	   : 		{
				_id    : 	 req.body.adminId,
				status : 	 '1',
				auth   :  	 2
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError("没有权限");
			}

			return userModel.select({
				where  		: 		{
					_id 	: 		req.body.userId
				}
			})
		}).then( result => {
			if(result.length === 0){
				this.paramError("用户不存在");
			}

			user = result[0];
			return userModel.delete({
				where 	: 	{
					'_id' : req.body.userId
				}
			})

		}).then( result => {
			return articleModel.delete({
				where 	: 	{
					'userId' : user._id
				}
			})
		}).then( result => {
			//删除用户缓存数据
			file.deleteDir('files/userId-' + user._id);
			return{
				data : result,
				str  : "删除用户全部信息"
			}
		})
	}
}