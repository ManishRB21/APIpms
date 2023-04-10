const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
const guests = require('./guests');
router.post('/checkin2', (req, res) => {
    console.log(req.body);
    // const {name, roomId } = req.body;
    const user= { 
        id: guests.length+1,
        name : req.body.name,
        roomId: req.body.roomId,
        lang : req.body.lang,
        email: req.body.email,
        phone: req.body.phone
    }
    guests.push(user);
    console.log(user)
    const isSwap = false;
    const now = new Date();
    let response = {
    Subscription: user.id,
      request: {
        type: 'checkin',
        room: user.roomId,
        checkin: {
          room: user.roomId,
          guest: null,
        },
        source: {
            type: (isSwap) ? 'swap' : 'live',
          },
        created: now.toISOString(),
      },
      response: {
        statusCode: 200,
        statusMessage: "success",
      },
    };
    
  
    res.json(response);
});

module.exports= router;