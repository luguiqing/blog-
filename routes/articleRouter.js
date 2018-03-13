const express = require('express');
const article = require('../controller/article');
const router = express.Router();

/* GET users listing. */
router.post('/addArticle', (...args) => article.safeMode( 'addArticle', ...args) );

router.post('/getArticleDetail', (...args) => article.safeMode( 'getArticleDetail', ...args) );

router.post('/getArticleListById', (...args) => article.safeMode( 'getArticleListById', ...args) );

router.post('/getHotArticleList', (...args) => article.safeMode( 'getHotArticleList', ...args) );

router.post('/getArticleListByPageAndId', (...args) => article.safeMode( 'getArticleListByPageAndId', ...args) );


module.exports = router;
