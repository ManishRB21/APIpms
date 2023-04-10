const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const guests = require('../guests')
const app = express();

router.post('/', (req, res) => {
    console.log("inside checkin")
    console.log(req.body);
    const user= { 
        id: "1",
        roomId :req.params.roomid,
        guestName : req.body.guestName,
        language : req.body.language,
        email : req.body.email,
        checkout : "",
        phone : req.body.phone,
        isSwap : "false",
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
          guest: user.guestName,
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