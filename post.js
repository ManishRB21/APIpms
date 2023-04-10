const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
const app = express();
app.use(express.static('public'));



// Middleware to parse request body
router.use(bodyParser.urlencoded({ extended: true }));

// Array to store submitted data
const submissions = [];

// Route to handle form submission
router.post('/check', (req, res) => {
  const { roomId, name } = req.body;
  submissions.push({ roomId, name });
  res.send('Data submitted successfully');
  console.log(submissions)
});

// Route to get all submissions
router.get('/m', (req, res) => {
    const response = {
      count: submissions.length,
      submissions: submissions.map(submission => {
        return {
          id: submission.id,
          name: submission.name,
          roomId: submission.roomId
        }
      })
    };
    res.json(response);
  });



module.exports=router;