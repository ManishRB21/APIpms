const express = require('express');
const router = express.Router();

router.use('/check', require('./check'));
router.use('/rooms', require('./room'));
router.use('/details', require('./detail'));
router.use('/subscriptions', require('./subscriptions'));



module.exports = router;