const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
require("dotenv").config(); // For environment variables

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, and JavaScript)
app.use(express.static(path.join(__dirname)));

// Path to comments.json file
const commentsFilePath = path.join(__dirname, "comments.json");

// Utility function to read comments from the file
const readCommentsFromFile = () => {
  try {
    const data = fs.readFileSync(commentsFilePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading comments file:", error);
    return [];
  }
};

// Utility function to write comments to the file
const writeCommentsToFile = (comments) => {
  try {
    fs.writeFileSync(commentsFilePath, JSON.stringify(comments, null, 2), "utf-8");
    console.log("Comments successfully saved to file.");
  } catch (error) {
    console.error("Error writing comments to file:", error);
  }
};

// Handle form submission (contact form)
app.post("/submit-form", (req, res) => {
  const { name, surname, email, phone, message } = req.body;

  console.log("Form data received:");
  console.log("Name:", name);
  console.log("Email:", email);
  console.log("Message:", message);

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: "ctubuddy4@gmail.com", // Use environment variable
      pass: "ctxb azqa qmfq wyyz", // Use environment variable
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

           For any queries, do not hesitate to reply.

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

// Handle comment submission (save to file)
app.post("/submit-comment", (req, res) => {
  const { name, question } = req.body;
  const timestamp = new Date().toISOString();

  const newComment = { name, question, timestamp };
  const comments = readCommentsFromFile();
  comments.push(newComment);

  writeCommentsToFile(comments);

  console.log("New comment saved:", newComment);
  res.json({ message: "Comment successfully saved!", comment: newComment });
});

// Fetch all comments
app.get("/comments", (req, res) => {
  const comments = readCommentsFromFile();
  res.json(comments);
});

// MongoDB connection for resource storage
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/resourcesDB')
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
  });

// Define resource schema
const resourceSchema = new mongoose.Schema({
  title: String,
  category: String,
  filePath: String,
});

const Resource = mongoose.model('Resource', resourceSchema);

// Set up storage for file uploads using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');  // Save files in 'uploads/' directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);  // Save the file with its original name
  },
});

const upload = multer({ storage: storage });

// Serve the index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload resource endpoint
app.post('/upload', upload.single('resourceFile'), async (req, res) => {
  try {
    const newResource = new Resource({
      title: req.body.resourceTitle,
      category: req.body.resourceCategory,
      filePath: req.file.path,
    });

    await newResource.save();
    res.status(200).send('File uploaded successfully!');
  } catch (err) {
    res.status(500).send('Error saving resource.');
  }
});

// Fetch all resources
app.get('/resources', async (req, res) => {
  try {
    const resources = await Resource.find({});
    res.json(resources);
  } catch (err) {
    res.status(500).send('Error fetching resources.');
  }
});

// Download resource endpoint
app.get('/download/:id', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).send('Resource not found.');
    }
    res.download(resource.filePath);
  } catch (err) {
    res.status(500).send('Error downloading resource.');
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
