module.exports	=	{
	success				:	{
		code		:	0,
		type		:	"info",
		msg			:	"操作成功"
	},
	paramError			:	{
		code		:	-1,
		type		:	"warning",
		msg			:	"参数缺失或格式错误"
	},
	fileSysError		:	{
		code		:	-2,
		type		:	"error",
		msg			:	"文件系统出错"
	},
	dbSysError			:	{
		code		:	-3,
		type		:	"error",
		msg			:	"数据库操作出错"
	},
	redisError			:	{
		code		:	-4,
		type		:	"error",
		msg			:	"redis错误"
	},
	noticeError			:	{
		code		:	-5,
		type		:	"error",
		msg			:	"消息系统错误"
	},
	httpError			:	{
		code		:	-6,
		type		:	"error",
		msg			:	"HTTP请求错误"
	},
	payError			:	{
		code		:	-7,
		type		:	"error",
		msg			:	"支付错误"
	},
	wechatError			:	{
		code		:	-8,
		type		:	"error",
		msg			:	"微信模块错误"
	},
	unKnownError		:	{
		code		:	-999,
		type		:	"error",
		msg			:	"未知系统错误"
	}
};
