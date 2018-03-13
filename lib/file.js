const Promise = require('bluebird');
const fs = Promise.promisifyAll(require("fs"));
const mkdirp = require("mkdirp");
const moment = require("moment");
const log =	require("./log");
const code = require("./code");
const path = require('path');
const rootName = 'files';

module.exports = class {
	//返回json或者string
	static readFile(path, type='string'){
		return new Promise( (resolve, reject) => {
			if(!fs.existsSync(path)){
				//fs.writeFileSync(path,'');
				return resolve({})
			}
			let readstream = fs.createReadStream(path);
			let bufArr = [];
			let bufLen = 0, buf;
			return readstream.on('data', chunk => {
				bufArr.push(chunk);
				bufLen += chunk.length;
			}).on('end', () => {
				try{
					buf = Buffer.alloc(bufLen);
					for(let i = 0, pos = 0; i<bufArr.length&&pos<bufLen; i++){
						bufArr[i].copy(buf,pos);
						pos += bufArr[i].length;
					}
					let result = buf.toString();
					switch(type){
						case 'json':
								return resolve(JSON.parse(result))
							break;
						case 'string':
						default:
							return resolve(result)
							break;
					}
				}catch( e ){
					log.error( e.message, "readFile" );
					reject( e );
				}
			})
		}).catch( e => {
			log.error( e.message, "readFile" );
			throw new Error( code.fileSysError.code );
		});
	}
	/*
	*@param path  <require|true>
	*@param data  <require|true>
	*@param dir  <require|false>
	*/
	static writeFile(path, data, dirName){
		console.log(dirName)
		if(dirName){
			if( !fs.existsSync( dirName ) ){
				mkdirp.sync( dirName );
			}
		}
		return new Promise( (resolve, reject) => {

			let writeStream = fs.createWriteStream(path);
			writeStream.write(data,'UTF8');

			writeStream.end();

			writeStream.on('finish', () => {
				return resolve();
			})
		}).catch( e => {
			log.error( e.message, "writeFile" );
			throw new Error( code.fileSysError.code );
		});
	}
	//处理编辑器传来的base64数据，并存于指定用户文件夹下(`user-${userId}`)
	static handleHtmlWithImg(content, userId){
		let imgReg = /<img[^>]+src="([^"]+)"/g,
			imgSrcReg = /src="([^"]+)"/g;
		let imgList, srcList = [], resultList = [];
		imgList = content.match( imgReg ) || [];

		imgList.forEach( item => {
			let temp = item.match(imgSrcReg)[0]
			temp = temp.substring(5, temp.length - 1);
			srcList.push(temp);
		})
		let dirName = "userId-" + userId;
		let promiseList = [];
		srcList.forEach( src => {
			let fileName, suffix;
			if(src.indexOf(';base64,') > -1){
				suffix = src.split(';base64,')[0];
				suffix = suffix.split('/')[1];
				fileName = moment().format("YYYY-MM-DD-h-mm-ss-a") + '_' + Math.random().toString(36).slice(3,8) + '.' + suffix;
				resultList.push(fileName)
				promiseList.push(this.writeFile(rootName + '/' + dirName + '/' + fileName, src, rootName + '/' + dirName));
				content = content.replace(src, "{{{" + fileName + "}}}")
			}
		})

		return Promise.all(promiseList).then(() => {
		    return {
				image : resultList,
				content : content
			}
		});
	}

	//解析HTML，补全图片base64数据
	static fetchHtml( content, userId ){
		let imgFileNames = content.match(/{{{\S+}}}/g);
		imgFileNames = imgFileNames ? imgFileNames : [];
		let promiseList = [];
		imgFileNames.forEach( item => {
			let fileName = item.substring(3, item.length - 3);
			promiseList.push(this.readFile(rootName + '/userId-' + userId + '/' + fileName, 'string' ));
		})

		return Promise.all(promiseList).then((result) => {
			imgFileNames.forEach( (item, index) => {
				content = content.replace(item, result[index])
			})
		    return content;
		});
	}
}