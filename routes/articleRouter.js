const express = require('express');
const article = require('../controller/article');
const router = express.Router();

/* GET users listing. */
router.post('/addArticle', (...args) => article.safeMode( 'addArticle', ...args) );

router.post('/getArticleDetail', (...args) => article.safeMode( 'getArticleDetail', ...args) );

router.post('/getArticleListById', (...args) => article.safeMode( 'getArticleListById', ...args) );

router.post('/getHotArticleList', (...args) => article.safeMode( 'getHotArticleList', ...args) );

router.post('/getArticleListByPageAndId', (...args) => article.safeMode( 'getArticleListByPageAndId', ...args) );

router.post('/getAllArticleList', (...args) => article.safeMode( 'getAllArticleList', ...args) );

router.post('/changeArticleStatus', (...args) => article.safeMode( 'changeArticleStatus', ...args) );

router.post('/forceDeleteArticle', (...args) => article.safeMode( 'forceDeleteArticle', ...args) );

router.post('/deleteArticle', (...args) => article.safeMode( 'deleteArticle', ...args) );

router.post('/getHomeArticleDetail', (...args) => article.safeMode( 'getHomeArticleDetail', ...args) );


module.exports = router;
