const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const path = require('path');
const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For JSON parsing

// Serve static files (HTML, CSS, JS)
app.use(express.static(path.join(__dirname)));

// MongoDB Connection (replace <username>, <password>, and <cluster-url> with your details)
mongoose.connect(process.env.MONGODB_URI || 'mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Check MongoDB connection
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});

// Define a schema and model for comments
const commentSchema = new mongoose.Schema({
  name: String,
  question: String,
  timestamp: { type: Date, default: Date.now },
});

const Comment = mongoose.model('Comment', commentSchema);

// Handle contact form submission
app.post('/submit-form', (req, res) => {
  const { name, surname, email, phone, message } = req.body;

  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.GMAIL_USER, // Use environment variables for sensitive data
      pass: process.env.GMAIL_PASS, // Use environment variables for sensitive data
    },
  });

  const mailOptionsToYou = {
    from: email,
    to: process.env.GMAIL_USER,
    subject: 'New Contact Form Submission',
    text: `You have received a new message from the contact form.
           Name: ${name} 
           Email: ${email}
           Message: ${message}`,
  };

  const mailOptionsToCustomer = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: 'Thank you for reaching out!',
    text: `Hello there ${name},
     
           Thank you for submitting your query.

           For any further questions, feel free to reply.

           Best regards,
           CTU Buddy`,
  };

  transporter.sendMail(mailOptionsToYou, (error, info) => {
    if (error) {
      console.log('Error sending email to yourself:', error);
      return res.status(500).send('Error sending email to you.');
    }

    transporter.sendMail(mailOptionsToCustomer, (error, info) => {
      if (error) {
        console.log('Error sending auto-reply to customer:', error);
        return res.status(500).send('Error sending auto-reply to customer.');
      }

      res.redirect('/thank-you.html');
    });
  });
});

// Handle the submission of new comments
app.post('/submit-comment', (req, res) => {
  const { name, question } = req.body;

  const newComment = new Comment({ name, question });

  newComment.save((err) => {
    if (err) {
      console.error('Error saving comment to MongoDB:', err.message);
      return res.status(500).json({ message: 'Error saving comment to the database.' });
    }

    console.log('New comment saved to the database:', { name, question });
    res.json({ message: 'Comment successfully saved!' });
  });
});

// Fetch all comments from the database
app.get('/comments', (req, res) => {
  Comment.find()
    .sort({ timestamp: -1 })
    .exec((err, comments) => {
      if (err) {
        console.error('Error retrieving comments from database:', err.message);
        return res.status(500).json({ message: 'Error retrieving comments.' });
      }

      res.json(comments); // Send all comments as JSON
    });
});

// Export the app for Vercel's serverless functions
module.exports = app;
