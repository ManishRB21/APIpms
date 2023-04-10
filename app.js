const express = require('express');
const bodyParser = require('body-parser');
const getRoute = require('./getRoute');
const getRoutefull = require('./getRoutefull');
const postRoute= require('./postRoute');
const postRoutefull= require('./postRoutefull');
const deleteRoute= require('./deleteRoute');
const folioRoute= require('./folioRoute');

const folionewRoute= require('./folionewRoute');
const getGuests= require('./getGuests');
const post = require('./post')
const app = express();
const router = require('./api');

app.use(bodyParser.json());
app.get('/', (req, res) => {
  console.log(__dirname)
  res.sendFile(__dirname + '/public/page.html');
});
/* app.get('/folio/201', (req, res) => {
  console.log(__dirname)
  res.sendFile(__dirname + '/public/folio.html');
}); */
app.use(router);
app.use(postRoute);
app.use(postRoutefull);
app.use(getRoute);
app.use(getRoutefull);
app.use(deleteRoute);
app.use(folioRoute);
app.use(getGuests);
app.use(folionewRoute);

app.listen(8080, () => {
  console.log('Server listening on port 8080');
});
