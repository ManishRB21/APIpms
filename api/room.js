const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const guests = require('../guests');
const rooms = require('../rooms');

router.get('/',(req,res)=>{
  console.log("inside room")
    let response = {
        response: {
          statusCode: 200,
          statusMessage: "success",
        },
      };
      
    
      res.json(response);
  });


router.get('/:roomid', (req, res) => {
    console.log("inside roomid")
  //   const roomId = parseInt(req.params.roomid);
  //  console.log(req)
  //    const guest = guests.find(g => g.roomId === roomId);
  //   console.log(roomId)
  //   if (!guest) {
  //     return res.status(404).json({
  //       error: `No guest found in room ${roomId}`
  //     });
  //   } 
   /*  const fullName = guest.name.split(' ');
    
const firstName = fullName[0];
const middleName = fullName[1];
const lastName = fullName[2]; */
//console.log(lastName)
    const response = {
    //   id: guest.id,
    //   name: guest.name,
    //   roomId: guest.roomId
    
        status: "success",
        data: {
            id: req.params.roomid,
            guests: [
                {
                    name: {
                        prefix: null,
                        first: null,
                        
                        middle: null,
                        last: "Anita",
                        suffix: null,
                        full: "Anita",
                    },
                    balance: null,
                    language: "" || null,
                    email: "" || null,
                    phone:  "",
                    no_post: null,
                    vip_status: null,
                    id: "101-1",
                    checkout: null,
                    option: null,
                    channel_preference: null,
                }
            ],
           // folios : {},
        }
    }
 
    res.json(response);
  });



  
  router.get('/:roomid/guests', (req, res) => {
    console.log("inside guests")
  //   const roomId = parseInt(req.params.roomid);
  // //  console.log(req)
  //   const room = rooms.find(r => r.roomId === roomId);
  //   console.log(roomId)
  //   if (!room) {
  //     return res.status(404).json({
  //       error: `No guest found in room ${roomId}`
  //     });
  //   }
    const firstName = req.body.data.firstName;
    const lastName = req.body.data.lastName;

    const response = {

    status: 'success',

        data : {
          checkedIn : true,
          firstName: firstName,
          lastName: lastName,
          salutation:"Mr",
        }
    }
    res.json(response);
  });


  router.use('/:roomid/checkin', require('./checkin'));
  router.use('/:roomid/folios', require('./folioRoute'));
  router.use('/:roomid/messages', require('./message'));
  router.use('/:roomid/checkout', require('./checkout'));

  module.exports=router;