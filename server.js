const express = require("express");
const nodemailer = require("nodemailer");
const bodyParser = require("body-parser");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // For environment variables

const app = express();
app.use(cors()); // Enable CORS
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files (HTML, CSS, and JavaScript)
app.use(express.static(path.join(__dirname)));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// MongoDB connection for resource storage
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/resourcesDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Define resource schema
const resourceSchema = new mongoose.Schema({
  title: String,
  category: String,
  filePath: String,
});

const Resource = mongoose.model("Resource", resourceSchema);

// Set up storage for file uploads using multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Save files in 'uploads/' directory
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Save the file with its original name
  },
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== "application/pdf") {
      return cb(new Error("Only PDF files are allowed!"), false);
    }
    cb(null, true);
  },
});

// Serve the index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Upload resource endpoint
app.post("/upload", upload.single("resourceFile"), async (req, res) => {
  try {
    const newResource = new Resource({
      title: req.body.resourceTitle,
      category: req.body.resourceCategory,
      filePath: req.file.path,
    });

    await newResource.save();
    res.status(200).send("File uploaded successfully!");
  } catch (err) {
    res.status(500).send("Error saving resource.");
  }
});

// Fetch all resources
app.get("/resources", async (req, res) => {
  try {
    const resources = await Resource.find({});
    res.json(resources);
  } catch (err) {
    res.status(500).send("Error fetching resources.");
  }
});

// Download resource endpoint
app.get("/download/:id", async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).send("Resource not found.");
    }
    res.download(resource.filePath);
  } catch (err) {
    res.status(500).send("Error downloading resource.");
  }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
