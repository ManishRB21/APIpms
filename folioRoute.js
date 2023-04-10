const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
app.use(express.static('public'));
app.use(bodyParser.json());
const guests = require('./guests');
const mariadb = require('mariadb'); 



const pool = mariadb.createPool({
  host :'localhost',
  user : "root",
  database : "mariadb",
  password : "qwerty"
});


router.post('/checkin/:roomId', (req, res) => {
    console.log(req.body);
  
    const user = {
      roomId: req.params.roomId,
      folio:req.body.folio,
    };
  
    pool.execute(
      'INSERT INTO folio (room_id, folio) VALUES (?, ?) ON DUPLICATE KEY UPDATE folio = CONCAT(folio, ?)',
    [user.roomId, user.folio, `;${user.folio}`],
      (err, result) => {
        if (err) {
          console.error(err);
          res.status(500).json({ error: 'Failed to insert data' });
          return;
        }
  
        console.log(result);
  
      }
    );
    
    guests.push(user);
  
    const isSwap = false;
    const now = new Date();
    const response = {
      Subscription: user.uid,
      request: {
        type: 'checkin',
        room: user.roomId,
        checkin: {
          room: user.roomId,
          guest: null,
        },
        source: {
          type: isSwap ? 'swap' : 'live',
        },
        created: now.toISOString(),
      },
      response: {
        statusCode: 200,
        statusMessage: 'success',
      },
    };
    console.log(response)
    res.json(response);
  });

  module.exports= router;