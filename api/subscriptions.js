const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const subscription = require('../subscription');
const app = express();

router.post('/', (req, res) => {
    console.log("insisde SUBSCRIPTION", req.body);
    // const now = new Date();
    const subs= { 
        uid : subscription.length+1,
        callbackUri: req.body.callbackUri,
        callbackToken : req.body.callbackToken,
        timestamp: req.body.timestamp
    }
    subscription.push(subs);
    const response ={
    status : "success",
    data: {
     "id": 1,
     "created": subs.timestamp,
     "name": "PCN",
     "callbackUri": 'https://10.221.46.187:60080/api/v2/events/pms'
    }
}
res.json(response);
console.log(response);
})

router.get('/sub', (req, res) => {
    const response = {
      count: subscription.length,
      submissions: subscription.map(sub => {
        console.log(sub);
        console.log(subscription);
        return {
            callbackUri: sub.callbackUri,
            callbackToken : sub.callbackToken,
            timestamp: sub.timestamp
        }
      })
    };
    res.json(response);
  });


module.exports= router;