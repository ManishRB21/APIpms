const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const guests = require('../guests');
const request = require('./request');
const app = express();

function sendCheckoutEvent(roomId, isSwap = false) {
    const now = new Date();
  
    const options = {
      uri: `http://127.0.0.1:8080/commands/events`,
      method: 'post',
      body: {
        type: 'checkout',
        room: roomId,
        swap: isSwap,
        checkout: {
          room: roomId,
          guest: null, 
          source: {
            type: (isSwap) ? 'swap' : 'live',
          },
        },
        created: now.toISOString(),
      },
    };
  
    return request(options)
      .catch(err => console.log(err));
  }

//   router.post('/', (req, res, next) => {
//     logger.debug(req.params);
//     const { roomid } = req.params;
//     const isSwap = _.get(req.body, 'isSwap', false);
  
//     try {
//       const schema = joi.object().keys({
//         roomid: joi.any().required(),
//       });
  
//       validator.validateRequestParams(req, schema);
//     } catch (err) {
//       return next(err);
//     }
  
//     requestRoomCheckout(roomid)
//       .then(() => sendCheckoutEvent(roomid, isSwap))
//       .then(() => createPostResponse(res))
//       .catch(error => next(error));
//   });
  
  router.post('/:guestid', (req, res, next) => {
    const { roomid, guestid } = req.params;
    const { balance } = req.body;
  
  
    
      sendCheckoutEvent(101)
      .then(() =>{
        
        res.json({
            status:"success"
        })
      }).catch((err)=>{
      console.log(err)
      })
  });

  module.exports=router