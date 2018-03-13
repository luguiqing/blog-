const	Model  		=  			require("../lib/Model");

module.exports = new class extends Model {
	constructor(){
		super()
		this.collection = "user.info";
		this.struct = {
			userName 	: 		{
				type  		: 		String,
				required 	: 		true
			},
			password 	: 		{
				type  		: 		String,
				required 	: 		true
			},
			status 		: 		{
				type  		: 		String,
				required 	: 		true,
				default  	: 		'1'
			},
			auth 		: 		{
				type  		: 		Number,
				required 	: 		true,
				default  	: 		1
			},
			salt 		: 		{
				type  		: 		Number,
				required 	: 		true
			},
			createDate 	: 		{
				type			:	Date,
				required		:	true
			},
			avatar 		: 		String,
			des 		: 		String
		}
	}
}