const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const guests = require('../guests')
const app = express();

app.use(bodyParser.json());
router.get('/', (req, res) => {
    console.log("inside details");
    const now = new Date();
    const detail = {
      id: "1234567",
      name: "lg_pms",
      timestamp: now.toISOString(),
    };
      
  console.log(detail);
  return res.json({
    status: 'success',
    data: detail || {},
  });
});

module.exports= router;