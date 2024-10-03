const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const path = require("path");
const { MongoClient } = require("mongodb"); // Import MongoDB client
require('dotenv').config(); // For environment variables (e.g., MongoDB URI, Gmail password)

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (your HTML, CSS, and JavaScript files)
app.use(express.static(path.join(__dirname)));

// MongoDB URI (use your MongoDB URI)
const uri = process.env.MONGODB_URI || "your-mongodb-atlas-uri";
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

let commentsCollection;

// Connect to MongoDB
client.connect(err => {
  if (err) {
    console.error("MongoDB connection error: ", err);
    process.exit(1); // Exit if connection fails
  }
  console.log("Connected to MongoDB");
  const db = client.db("your-database-name"); // Replace with your database name
  commentsCollection = db.collection("comments"); // Collection for comments
});

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
      user: process.env.GMAIL_USER, // Environment variable for Gmail user
      pass: process.env.GMAIL_PASS, // Environment variable for Gmail app password
    },
  });

  const mailOptionsToYou = {
    from: email,
    to: process.env.GMAIL_USER,
    subject: "New Contact Form Submission",
    text: `You have received a new message from the contact form.
           Name: ${name} 
           Email: ${email}
           Message: ${message}`,
  };

  const mailOptionsToCustomer = {
    from: process.env.GMAIL_USER,
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
app.post("/submit-comment", async (req, res) => {
  const { name, question } = req.body;
  const timestamp = new Date().toISOString(); // Automatically generate the timestamp

  try {
    // Insert new comment into the MongoDB collection
    await commentsCollection.insertOne({ name, question, timestamp });
    console.log("New comment saved to MongoDB:", { name, question, timestamp });
    res.json({ message: "Comment successfully saved!", comment: { name, question, timestamp } });
  } catch (err) {
    console.error("Error saving comment to MongoDB: ", err.message);
    res.status(500).json({ message: "Error saving comment to MongoDB." });
  }
});

// Route to fetch all comments from the MongoDB collection
app.get("/comments", async (req, res) => {
  try {
    const comments = await commentsCollection.find().sort({ timestamp: -1 }).toArray();
    res.json(comments); // Send all comments as JSON
  } catch (err) {
    console.error("Error retrieving comments from MongoDB: ", err.message);
    res.status(500).json({ message: "Error retrieving comments." });
  }
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
