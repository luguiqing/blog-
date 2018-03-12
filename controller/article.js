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

		return userModel.select({
			where : {
				_id  :  req.body.userId
			}
		}).then( result => {
			if(result.length === 0){
				this.paramError("用户不存在")
			}
			return file.handleHtmlWithImg(req.body.content, req.body.userId)
		}).then( result => {
			let message = result;
			if(req.body.articleId !== undefined || req.body.articleId !== null){
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
}