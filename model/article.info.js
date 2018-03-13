const	Model  		=  			require("../lib/Model");

module.exports = new class extends Model {
	constructor(){
		super()
		this.collection = "article.info";
		this.struct = {
			title 	: 		{
				type  		: 		String,
				required 	: 		true
			},
			brief 	: 		{
				type  		: 		String,
				required 	: 		true
			},
			content 		: 		{
				type  		: 		String,
				required 	: 		true
			},
			userId 		: 		{
				type  		: 		Number,
				required 	: 		true
			},
			userName 		: 		String,
			status 		: 		{
				type  		: 		Number,
				required 	: 		true,
				default  	: 		0
			},
			createDate 	: 		{
				type			:	Date,
				required		:	true,
				default 		: 	Date.now
			},
			updateDate 	: 		Date,
			image 		: 		[String],
			tagId		: 		[String],
			likes 		: 		[String]
		}
	}
}