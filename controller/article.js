const 	Controller  	= 		require("../lib/Controller");
const 	fs 				= 		require('fs');
const 	file  			= 		require("../lib/file");
const 	moment 			= 		require('moment');
const 	articleModel  	= 		require("../model/article.info");
const 	userModel  		= 		require("../model/user.info");




module.exports = new class extends Controller{
	//其中图片以用户id的形式存到文件夹中
	addArticle( req ){
		//status|number, 是否对外展示，tagId|array, likes|array
		//有articleId则为更新，否则为添加
		this.validEmpty(["userId", "content", "title", "brief", "status"], req.body);
		let userName;
		return userModel.select({
			where : {
				_id    :  req.body.userId,
				status :  '1'
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError("用户不存在或者被冻结")
			}
			userName = result[0].userName;
			return file.handleHtmlWithImg(req.body.content, req.body.userId)
		}).then( result => {
			let message = result;
			if(req.body.articleId !== undefined && req.body.articleId !== null){
				return articleModel.select({
					where : {
						_id    :  req.body.articleId,
						userId :  req.body.userId
					}
				}).then( result => {
					if(result.length === 0){
						this.paramError('文章不存在')
					}
					let image = result[0]['image'];
					console.log(message.image)
					return articleModel.update({
						where 		   : 		{
							_id  : 	req.body.articleId
						},
						obj 		   :  		{
							title 		: 		req.body.title,
							brief 		: 		req.body.brief,
							status 		:  		req.body.status,
							userId 		: 		req.body.userId,
							content 	: 		message.content,
							image 		: 		message.image,
							updateDate 	: 		Date.now()
						}
					}).then( result => {
						console.log("in")
						image.forEach( item => {
							if(fs.existsSync('files/userId-' + req.body.userId + '/' + item)){
								fs.unlinkSync('files/userId-' + req.body.userId + '/' + item);
							}
						})
						return req.body.articleId;
					})
				})
			}else{
				return articleModel.insert({
					title 		: 		req.body.title,
					userName 	: 		userName,
					brief 		: 		req.body.brief,
					status 		:  		req.body.status,
					userId 		: 		req.body.userId,
					content 	: 		message.content,
					image 		: 		message.image
				})
			}
		}).then( result => {
			//console.log(result)
			return{
				data :   result,
				str  :   "新增文章成功"
			}
		})
	}

	getArticleDetail( req ){
		//
		this.validEmpty(["userId", "articleId"], req.body);
		let articleDetail;
		return articleModel.select({
			where : {
				_id    :  req.body.articleId,
				userId :  req.body.userId
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError('文章不存在')
			}
			articleDetail = result[0];
			return file.fetchHtml(articleDetail.content, articleDetail.userId)
		}).then( result => {
			articleDetail.content = result
			return{
				data :   articleDetail,
				str  :   "加载文章成功"
			}
		})
	}

	//获取用户自己的文章列表
	getArticleListById( req ){
		this.validEmpty(["userId"], req.body);

		return articleModel.select({
			where 	: 	{
				userId  	: 		req.body.userId
			},
			field 	: 	[ 0, 'image', "content"],
			order  	: 	{
				'_id' 	 : 		-1
			}
		}).then( result => {
			//field不知为啥不起作用
			result.forEach( item => {
				if(item.content.length > 0){
					delete item.content;
				}
			})
			return{
				data : result,
				str  : "获取自己文章列表成功"
			}
		})
	}

	//分页获取热门文章
	/*
	* pageSize    一次加载条数
	* page 		  加载第几页内容
	*/
	getHotArticleList( req ){
		this.validEmpty(["pageSize", "page"], req.body);

		return articleModel.select({
			where 	: 	{
				status  	: 		1
			},
			field 	: 	[ 0, 'image', "content"],
			order  	: 	{
				'_id' 	 : 		-1
			},
			limit 	: 	{
				min      : 	(req.body.page-1)*req.body.pageSize,
				num   	 : 	req.body.pageSize
			}
		}).then( result => {
			result.forEach( item => {
				if(item.content.length > 0){
					delete item.content;
				}
			})
			return{
				data : result,
				str  : "获取热门文章列表成功"
			}
		})
	}

	//分页获取个人文章
	/*
	* pageSize    一次加载条数
	* page 		  加载第几页内容
	*/
	getArticleListByPageAndId( req ){
		this.validEmpty(["userId","pageSize", "page"], req.body);

		return articleModel.select({
			where 	: 	{
				userId  	: 		req.body.userId
			},
			field 	: 	[ 0, 'image', "content"],
			order  	: 	{
				'_id' 	 : 		-1
			},
			limit 	: 	{
				min      : 	(req.body.page-1)*req.body.pageSize,
				num   	 : 	req.body.pageSize
			}
		}).then( result => {
			//field不知为啥不起作用
			result.forEach( item => {
				if(item.content.length > 0){
					delete item.content;
				}
			})
			return{
				data : result,
				str  : "获取自己文章列表成功"
			}
		})
	}
}