const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());
const mariadb = require('mariadb'); 


var host = "localhost";
var user = "root";
var database = "mariadb";
var password = "qwerty";


router.get('/guests', (req, res) => {
  mariadb.createConnection({
    host: host,
    database: database,
    user: user,
    password: password
  })
    .then(conn => {
      return conn.query("SELECT * FROM guests ");
    })
    .then((result) => {
      console.log("complete")
      res.status(200).json({ "status": true, "data": result });
    })
    .catch(err => {
      res.status(500).json({ "status": false, "message": err.message });
    });
});


  module.exports=router;