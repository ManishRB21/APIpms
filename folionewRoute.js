const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
const app = express();
const folio = require('./folio');
app.use(bodyParser.json());


router.post('/folio/:id', (req, res) => {

    const data= { 
        uid: folio.length+1,
        id : req.params.id,
        amount : req.body.amount,
        description: req.body.description
    }
    folio.push(data);
    console.log(folio);
    
    let response = {
          response: {
            statusCode: 200,
            statusMessage: "success",
          },
        };
        
      
        res.json(response);
    });


/////////////////////////////////////


//   router.get('/folio/:id', (req, res) => {

//     const id = req.params.id;
//     const now = new Date();
//     let balance = 0;
//     for (let fol of folio) {
//       if (fol.id === id) {
//         balance += fol.amount;
//       }
//     }
//     let response = {
//         count: folio.length,
//         id: id,
//         status: 'open',
//       balance: balance,
//       submissions: folio.map(fol => {
//         return {
//         id:id,
//         uid: fol.uid,
//         created: now.toISOString(),
//         description: fol.description,
//         amount: fol.amount,
//         display: true,
//         }
//       })
//     };
//     res.json(response);
//   });
router.get('/folio/:id', (req, res) => {

    const id = req.params.id;
    const filteredGuests = folio.filter(folio => folio.id === id);
    const balance = filteredGuests.reduce((acc, curr) => acc + curr.amount, 0);
    const now = new Date();
    let response = {
        id: id,
        status: 'open',
        balance: balance,
    //     items: {
    //     data: filteredGuests,
    // }
    submissions: filteredGuests.map(fil => {
                return {
                id:id,
                uid: fil.uid,
                created: now.toISOString(),
                description: fil.description,
                amount: fil.amount,
                display: true,
                }
              })
    };
    
    res.json(response);
});


    
    module.exports= router;