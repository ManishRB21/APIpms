const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const request = require('./request');
// const { checkout } = require('./folioRoute');
const app = express();

function createPostResponse(res, result) {
    result.body.status = 'success';
    return res.json(result.body);
  }

function sendMessageEvent(roomId, text) {
    const now = new Date();
  
    const options = {
      uri: `http://127.0.0.1:8080/commands/events`,
      method: 'post',
      body: {
        id: "abcdef",
        type: 'popup',
        room: roomId,
        popup: {
          room: roomId,
          message: text,
        },
        created: now.toISOString(),
      },
    };
  
    return request(options)
      .catch(err => console.log(err));
  }


  router.post('/', (req, res, next) => {
  
    const roomId =  101;
    const text = req.body.text;
  
    sendMessageEvent(roomId, text)
      .then(result =>{ console.log(result)
        createPostResponse(res, result)})
      .catch(error => console.log(error));
  });
  
  router.put('/:messageid', (req, res, next) => {
    console.log("inside msg");
    const { roomid, messageid } = req.params;
    const { guest } = req.body;
    console.log(`PUT api/v2/rooms/${roomid}/messages/${messageid}`);
    res.json({status: 'success'});
  })
  module.exports = router