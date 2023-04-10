const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const site = require('../site')
const app = express();

app.use(bodyParser.json());
router.post('/', (req, res) => {
    const user= { 
      id: req.body.id,
      name: req.body.name,
      currency: req.body.currency,
      
    }
    site.push(user);
    console.log(user,site)
    let response = {
      response: {
        statusCode: 200,
        statusMessage: "success",
      },
    };
    res.json(response);
});

router.get('/', (req, res) => {
    console.log("inside site", req.body)
   
    const resp = {
    
            id: site[0].id,
            name: site[0].name,
            currency: site[0].currency,
            statusMessage: "success",
        
      };
  console.log(resp);
    res.json(resp);
});

module.exports= router;