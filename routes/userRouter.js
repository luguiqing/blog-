const express = require('express');
const user = require('../controller/user');
const router = express.Router();

/* GET users listing. */
router.post('/login', (...args) => user.safeMode( 'login', ...args) );

router.post('/register', (...args) => user.safeMode( 'register', ...args) );

router.post('/editUserInfo', (...args) => user.safeMode( 'editUserInfo', ...args) );

router.post('/changeUserStatus', (...args) => user.safeMode( 'changeUserStatus', ...args) );

router.post('/getUserList', (...args) => user.safeMode( 'getUserList', ...args) );

router.post('/forceDeleteUser', (...args) => user.safeMode( 'forceDeleteUser', ...args) );


module.exports = router;
