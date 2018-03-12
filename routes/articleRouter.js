const express = require('express');
const article = require('../controller/article');
const router = express.Router();

/* GET users listing. */
router.post('/addArticle', (...args) => article.safeMode( 'addArticle', ...args) );

router.post('/getArticleDetail', (...args) => article.safeMode( 'getArticleDetail', ...args) );


module.exports = router;
