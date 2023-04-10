const express = require('express');
const router = express.Router();

router.use('/commands', require('./command2'));
// PCS -> PMS
router.use('/api/pms', require('./pms'));

module.exports = router;