const express = require('express');
const router  = express.Router();

const blockinfo = require('./userApi/blocksInfo');
const basic = require('./userApi/basic');

router.get('/getHomePageData', blockinfo.getHomePageData);
router.get('/generatenewaddress', basic.generatenewaddress);

module.exports = router;





