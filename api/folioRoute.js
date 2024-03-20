const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
const folio = require('../folio');


// router.post('/', (req, res) => {
    
//     /* const sub = req.body.items.map(data =>)   */

//     const user= { 
//         id : "900",
//         status: req.body.status,
//         balance: req.body.balance,
//         description:"",
//         amount:"",
//         display: ""
//         }
//     folio.push(user);
    
//     console.log(folio);
//     let response = {

//       status : "success",
//         };
    
//     res.json(response);
// });


router.get('/:guestId', (req,res)=>{
  console.log("inide folio")
  const response={
  //   data :{
  //     id : "101-1",
  //     status:"open",
  //     balance:65.19,
  //     items: [
  //     {
  //     id: 1,
  //     created:"2012-05-25T17:27Z",
  //     description:"in room movie",
  //     amount:5.19,
  //     display: true
  //     }
  //   ]
  // }
      {
   "status":"success",
   "data":{
      "id":"1401-1",
      "status":"open",
      "items":[
         {
            "auth":{
               "client_id":"0",
               "client_secret":"hoteltech"
            },
            "amount":1,
            "description":"test",
            "purchase_id":"ARAAnQAA",
            "revenue_code":"1",
            "subtotal":{
               "1":1
            },
            "tax":{
               "1":0.12
            },
            "id":1,
            "created":"2024-03-20T09:58:38.432Z"
         }
      ],
      "balance":1
   }
}
}
  res.json(response);
});

module.exports= router;
