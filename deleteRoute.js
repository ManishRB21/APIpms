
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
const guests = require('./guests'); 

router.delete('/checkin/room/:roomId', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const index = guests.findIndex(guest => guest.roomId === roomId);
    if (index === -1) {
      res.status(404).json({
        error: 'Guest not found'
      });
    } else {
      guests.splice(index, 1);
      res.json({
        response: {
          statusCode: 200,
          statusMessage: 'success'
        }
      });
    }
  });
  module.exports=router;
