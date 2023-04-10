const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();


router.use(bodyParser.urlencoded({ extended: true }));
const guests = require('./guests');

router.get('/checkin', (req, res) => {
  const response = {
    count: guests.length,
    submissions: guests.map(guest => {
      return {
        id: guest.uid,
        name: guest.name,
        roomId: guest.roomId
      }
    })
  };
  res.json(response);
});




  module.exports=router;