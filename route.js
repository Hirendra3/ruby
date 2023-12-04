const express = require('express');
const router  = express.Router();

const blockinfo = require('./controller/blocksInfo');
const basic = require('./controller/basic');

router.get('/getHomePageData', blockinfo.getHomePageData);
router.get('/customBlockData', blockinfo.customBlockData);
router.get('/getTransactionData', blockinfo.getTransactionData);
router.post('/getAddressinfoData', blockinfo.getAddressinfoData);
router.get('/getBlockCount', blockinfo.getBlockCount);


router.get('/generatenewaddress', basic.generatenewaddress);

module.exports = router;





