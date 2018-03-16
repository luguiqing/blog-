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

	//获取全部文章列表
	getAllArticleList( req ){
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

			return articleModel.select({
				field 	: 	[ 0, 'image', "content"],
				order  	: 	{
					'_id' 	 : 		-1
				}
			})
		}).then( result => {
			//field不知为啥不起作用
			result.forEach( item => {
				if(item.content.length > 0){
					delete item.content;
				}
			})
			return{
				data : result,
				str  : "获取全部文章列表成功"
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

	//管理员强制不让其上热门博客
	changeArticleStatus( req ){
		this.validEmpty(["userId", "articleId", "status"], req.body);

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

			return articleModel.update({
				where  		: 		{
					_id 	: 		req.body.articleId
				},
				obj 		: 		{
					status 	: 		req.body.status
				}
			})
		}).then( result => {
			return{
				data : result,
				str  : "更改文章status成功"
			}
		})
	}

	//管理员强制删除用户文章
	forceDeleteArticle( req ){
		this.validEmpty(["userId", "articleId"], req.body);
		let article;
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

			return articleModel.select({
				where  		: 		{
					_id 	: 		req.body.articleId
				}
			})
		}).then( result => {
			if(result.length === 0){
				this.paramError("文章不存在");
			}

			article = result[0];
			return articleModel.delete({
				where 	: 	{
					'_id' : req.body.articleId
				}
			})

		}).then( result => {
			article.image.forEach( item => {
				if(fs.existsSync('files/userId-' + article.userId + '/' + item)){
					fs.unlinkSync('files/userId-' + article.userId + '/' + item);
				}
			})
			return{
				data : result,
				str  : "删除文章"
			}
		})
	}

	//用户删除文章
	deleteArticle( req ){
		this.validEmpty(["userId", "articleId"], req.body);
		let article;
		return userModel.select({
			where 	   : 		{
				_id    : 	 req.body.userId,
				status : 	 '1'
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError("你已经被管理员冻结账户");
			}

			return articleModel.select({
				where  		: 		{
					_id 	: 		req.body.articleId,
					userId 	: 		req.body.userId
				}
			})
		}).then( result => {
			if(result.length === 0){
				this.paramError("文章不存在");
			}

			article = result[0];
			return articleModel.delete({
				where 	: 	{
					'_id' : req.body.articleId
				}
			})

		}).then( result => {
			article.image.forEach( item => {
				if(fs.existsSync('files/userId-' + article.userId + '/' + item)){
					fs.unlinkSync('files/userId-' + article.userId + '/' + item);
				}
			})
			return{
				data : result,
				str  : "用户删除文章"
			}
		})
	}

	//两种方式查看，游客和作者自己
	getHomeArticleDetail( req ){
		this.validEmpty(["articleId"], req.body);
		let articleDetail, prev, next, author = false;

		if(req.body.userId !== null && req.body.userId !== undefined){
			//有登录
			return articleModel.select({
				where : {
					_id    :  req.body.articleId,
					userId :  req.body.userId
				}
			}).then( result => {
				if(result.length === 0){
					return false; //确认不是作者本人
				}
				return result;
			}).then( result => {
				author = result ? true : false; //确定是否为作者本人
				if(author){
					articleDetail = result[0];
					return file.fetchHtml(articleDetail.content, articleDetail.userId)
				}else{
					return articleModel.select({
						where : {
							_id    :  req.body.articleId,
							status :  1
						}
					}).then( result => {
						if(result.length === 0){
							this.paramError("没有权限查看或者文章不存在")
						}
						articleDetail = result[0];
						return file.fetchHtml(articleDetail.content, articleDetail.userId)
					})
				}

			}).then( result => {
				articleDetail.content = result;
				let where = {
					_id      :  {
						'$lt'  : 	articleDetail._id
					}
				}
				if(author){
					where.userId = articleDetail.userId;
				}
				//查找上一条数据
				return articleModel.select({
					where,
					order : {
						_id : -1
					},
					field : [0, 'content'],
					limit : {
						min : 0,
						num : 1
					}
				})
			}).then( result => {
				if(result.length > 0){
					delete result[0]['content'];
					articleDetail.next = result[0]
				}
				let where = {
					_id      :  {
						'$gt'  : 	articleDetail._id
					}
				}
				if(author){
					where.userId = articleDetail.userId;
				}
				//查找下一条数据
				return articleModel.select({
					where,
					order : {
						_id : 1
					},
					field : [0, 'content'],
					limit : {
						min : 0,
						num : 1
					}
				})
			}).then( result => {
				if(result.length > 0){
					delete result[0]['content'];
					articleDetail.prev = result[0]
				}
				return{
					data :   articleDetail,
					str  :   "加载文章成功"
				}
			})
		}else{
			//没有登录
			return articleModel.select({
				where : {
					_id    :  req.body.articleId,
					status :  1
				}
			}).then( result => {
				if(result.length === 0){
					this.paramError("没有权限查看或者文章不存在")
				}
				articleDetail = result[0];
				return file.fetchHtml(articleDetail.content, articleDetail.userId)
			}).then( result => {
				articleDetail.content = result
				//查找上一条数据
				return articleModel.select({
					where : {
						_id      :  {
							'$lt'  : 	articleDetail._id
						}
					},
					order : {
						_id : -1
					},
					field : [0, 'content'],
					limit : {
						min : 0,
						num : 1
					}
				})
			}).then( result => {
				if(result.length > 0){
					delete result[0]['content'];
					articleDetail.next = result[0]
				}

				//查找下一条数据
				return articleModel.select({
					where : {
						_id      :  {
							'$gt'  : 	articleDetail._id
						}
					},
					order : {
						_id : 1
					},
					field : [0, 'content'],
					limit : {
						min : 0,
						num : 1
					}
				})
			}).then( result => {
				if(result.length > 0){
					delete result[0]['content'];
					articleDetail.prev = result[0]//因时间倒叙
				}
				return{
					data :   articleDetail,
					str  :   "加载文章成功"
				}
			})
		}

		return articleModel.select({
			where : {
				_id    :  req.body.articleId,
				status :  1
			}
		}).then( result => {
			if(result.length === 0){
				this.validEmpty(["userId"], req.body);
				return articleModel.select({
					where : {
						_id    :  req.body.articleId,
						userId :  req.body.userId
					}
				}).then( result => {
					if(result.length === 0){
						this.paramError("没有权限查或者文章不存在")
					}
					articleDetail = result[0];
					return file.fetchHtml(articleDetail.content, articleDetail.userId)
				});
			}else{
				articleDetail = result[0];
				return file.fetchHtml(articleDetail.content, articleDetail.userId)
			}
		}).then( result => {
			articleDetail.content = result
			//查找上一条数据
			return articleModel.select({
				where : {
					_id    :  req.body.articleId,
					userId :  req.body.userId
				}
			})
		}).then( result => {
			articleDetail.content = result
			return{
				data :   articleDetail,
				str  :   "加载文章成功"
			}
		})
	}
}