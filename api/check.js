const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const guests = require('../guests')
const app = express();

app.use(bodyParser.json());
router.post('/', (req, res) => {
    console.log("inside check", req.body)
   // console.log(req.body);
    // const {name, roomId } = req.body;
    const user= { 
      host: req.body.host,
      port: req.body.port,
      user: "lge",
      password: "123456",
      auth: {
      client_id: req.body.auth.client_id,
      client_secret: req.body.auth.client_secret
      }
    }
    guests.push(user);
    console.log(user)
    console.log(guests, "GUEST")
    


    let response = {
      response: {
        statusCode: 200,
        statusMessage: "success",
      },
    };
    
  
    res.json(response);
});

module.exports= router;