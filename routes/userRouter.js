const express = require('express');
const user = require('../controller/user');
const router = express.Router();

/* GET users listing. */
router.post('/login', (...args) => user.safeMode( 'login', ...args) );

router.post('/register', (...args) => user.safeMode( 'register', ...args) );

router.post('/editUserInfo', (...args) => user.safeMode( 'editUserInfo', ...args) );


module.exports = router;
