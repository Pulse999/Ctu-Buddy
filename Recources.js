const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/resourcesDB', { useNewUrlParser: true, useUnifiedTopology: true });

const resourceSchema = new mongoose.Schema({
    title: String,
    category: String,
    filePath: String
});

const Resource = mongoose.model('Resource', resourceSchema);

// Set up storage for file uploads using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Store uploaded files in 'uploads' folder
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);  // Use the original file name
    }
});

const upload = multer({ storage: storage });

// Middleware to serve static files (HTML and CSS) from the root directory
app.use(express.static(__dirname));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve the index.html file directly from the root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));  // Serve index.html from the root
});

// Upload resource
app.post('/upload', upload.single('resourceFile'), (req, res) => {
    const newResource = new Resource({
        title: req.body.resourceTitle,
        category: req.body.resourceCategory,
        filePath: req.file.path
    });

    newResource.save().then(() => {
        res.redirect('/');  // Redirect to home page after successful upload
    }).catch(err => res.status(500).send('Error saving resource.'));
});

// Search resources
app.get('/search', (req, res) => {
    const searchQuery = req.query.q;
    Resource.find({ title: new RegExp(searchQuery, 'i') }, (err, resources) => {
        if (err) return res.status(500).send('Error during search.');
        res.json(resources);  // Send matching resources as JSON response
    });
});

// Download resource
app.get('/download/:id', (req, res) => {
    Resource.findById(req.params.id, (err, resource) => {
        if (err) return res.status(500).send('Error downloading resource.');
        res.download(resource.filePath);  // Download the file using the stored filePath
    });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
