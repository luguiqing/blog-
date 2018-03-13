const 	Controller  	= 		require("../lib/Controller");
const 	md5 			= 		require('md5');
const 	moment 			= 		require('moment');
const 	userModel  		= 		require("../model/user.info");




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
}