const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
app.use(express.static('public'));

const guests = require('./guests');
// const mariadb = require('mariadb'); 

router.use(bodyParser.urlencoded({ extended: true }));

// const pool = mariadb.createPool({
//   host :'localhost',
//   user : "root",
//   database : "mariadb",
//   password : "qwerty"
// });

// router.post('/checkin', (req, res) => {
//   console.log(req.body);

//   const user = {
//     uid: guests.length + 1,
//     name: req.body.name,
//     roomId: req.body.roomId,
//   };

//   pool.execute(
//     'INSERT INTO guests (name, room_id) VALUES (?, ?)',
//     [user.name, user.roomId],
//     (err, result) => {
//       if (err) {
//         console.error(err);
//         res.status(500).json({ error: 'Failed to insert guest data' });
//         return;
//       }

//       console.log(result);

//     }
//   );
//   guests.push(user);

//       const isSwap = false;
//       const now = new Date();
//       const response = {
//         Subscription: user.uid,
//         request: {
//           type: 'checkin',
//           room: user.roomId,
//           checkin: {
//             room: user.roomId,
//             guest: null,
//           },
//           source: {
//             type: isSwap ? 'swap' : 'live',
//           },
//           created: now.toISOString(),
//         },
//         response: {
//           statusCode: 200,
//           statusMessage: 'success',
//         },
//       };
//       console.log(response)
//       res.json(response);
//     }
// );


router.post('/checkin', (req, res) => {
    console.log(req.body);
    // const {name, roomId } = req.body;
    const user= { 
        uid: guests.length+1,
        name : req.body.name,
        roomId: req.body.roomId
    }
    guests.push(user);
    console.log(guests);
    
    const isSwap = false;
    const now = new Date();
    let response = {
    Subscription: user.uid,
      request: {
        type: 'checkin',
        room: user.roomId,
        checkin: {
          room: user.roomId,
          guest: null,
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