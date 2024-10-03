const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const path = require("path");
const sqlite3 = require("sqlite3").verbose(); // Import SQLite

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json()); // For JSON parsing

// Serve static files (your HTML, CSS, and JavaScript files)
app.use(express.static(path.join(__dirname)));

// Connect to SQLite database (or create it if it doesn't exist)
const db = new sqlite3.Database('./comments.db', (err) => {
  if (err) {
    return console.error("Database connection error: ", err.message);
  }
  console.log('Connected to the SQLite database.');
});

// Create a table for storing comments if it doesn't exist
db.run(`CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  question TEXT NOT NULL,
  timestamp TEXT NOT NULL
)`);

// Handle the form submission (contact form)
app.post("/submit-form", (req, res) => {
  const { name, surname, email, phone, message } = req.body;

  console.log("Form data received:");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Message:", message);

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "ctubuddy4@gmail.com",
      pass: "ctxb azqa qmfq wyyz", // Your Gmail password or app password
    },
  });

  const mailOptionsToYou = {
    from: email,
    to: "ctubuddy4@gmail.com",
    subject: "New Contact Form Submission",
    text: `You have received a new message from the contact form.
           Name: ${name} 
           Email: ${email}
           Message: ${message}`,
  };

  const mailOptionsToCustomer = {
    from: "ctubuddy4@gmail.com",
    to: email,
    subject: "Thank you for reaching out!",
    text: `Hello there ${name},
     
           Thank you for submitting.

           For any queries do not hesitate to reply.

           Best regards,
           CTU Buddy`,
  };

  transporter.sendMail(mailOptionsToYou, (error, info) => {
    if (error) {
      console.log("Error sending email to yourself: ", error);
      return res.status(500).send("Error sending email to you.");
    }

    transporter.sendMail(mailOptionsToCustomer, (error, info) => {
      if (error) {
        console.log("Error sending auto-reply to customer: ", error);
        return res.status(500).send("Error sending auto-reply to customer.");
      }

      res.redirect("/thank-you.html");
    });
  });
});

// Route for handling AJAX requests to submit a new post/comment
app.post("/submit-comment", (req, res) => {
  const { name, question } = req.body;
  const timestamp = new Date().toISOString(); // Automatically generate the timestamp

  // Insert new comment into the database
  db.run(`INSERT INTO comments (name, question, timestamp) VALUES (?, ?, ?)`, [name, question, timestamp], function(err) {
    if (err) {
      console.error("Error saving comment to the database: ", err.message);
      return res.status(500).json({ message: "Error saving comment to the database." });
    }

    console.log("New comment saved to the database:", { name, question, timestamp });
    res.json({ message: "Comment successfully saved!", comment: { name, question, timestamp } });
  });
});

// Route to fetch all comments from the database
app.get("/comments", (req, res) => {
  db.all(`SELECT * FROM comments ORDER BY timestamp DESC`, [], (err, rows) => {
    if (err) {
      console.error("Error retrieving comments from database: ", err.message);
      return res.status(500).json({ message: "Error retrieving comments." });
    }
    
    res.json(rows); // Send all comments as JSON
  });
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
