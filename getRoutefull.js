const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const guests = require('./guests');


router.get('/checkin/room/:roomId', (req, res) => {
    const roomId = parseInt(req.params.roomId);
    const guest = guests.find(g => g.roomId === roomId);
    if (!guest) {
      return res.status(404).json({
        error: `No guest found in room ${roomId}`
      });
    }
    const fullName = guest.name.split(' ');
    
const firstName = fullName[0];
const middleName = fullName[1];
const lastName = fullName[2];
console.log(lastName)
    const response = {
    //   id: guest.id,
    //   name: guest.name,
    //   roomId: guest.roomId
    
        status: "success",
        data: {
            id: guest.id,
            guests: [
                {
                    name: {
                        prefix: null,
                        first: firstName,
                        middle: middleName,
                        last: lastName,
                        suffix: null,
                        full: fullName,
                    },
                    balance: null,
                    language: guest.lang || null,
                    email: guest.email || null,
                    phone:  guest.phone,
                    no_post: null,
                    vip_status: null,
                    id: guest.id,
                    checkout: null,
                    option: null,
                    channel_preference: null,
                }
            ],
            folios : {},
        }
    }
    res.json(response);
  });
  
  
  

  module.exports=router;