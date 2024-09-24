const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const fs = require('fs');  // For file system operations
const app = express();

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/resourcesDB')
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

const resourceSchema = new mongoose.Schema({
    title: String,
    category: String,
    filePath: String
});

const Resource = mongoose.model('Resource', resourceSchema);

// Set up storage for file uploads using multer
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');  // Save files in 'uploads/' directory
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);  // Save the file with its original name
    }
});

const upload = multer({ storage: storage });

// Middleware to serve static files (HTML and CSS) from the root directory
app.use(express.static(__dirname));

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));

// Serve the index.html file directly from the root directory
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Upload resource
app.post('/upload', upload.single('resourceFile'), async (req, res) => {
    try {
        const newResource = new Resource({
            title: req.body.resourceTitle,
            category: req.body.resourceCategory,
            filePath: req.file.path
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
        res.json(resources);  // Return resources as JSON
    } catch (err) {
        res.status(500).send('Error fetching resources.');
    }
});

// Download resource
app.get('/download/:id', async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).send('Resource not found.');
        }
        res.download(resource.filePath);  // Download the file
    } catch (err) {
        res.status(500).send('Error downloading resource.');
    }
});

// Delete resource
app.delete('/delete/:id', async (req, res) => {
    try {
        // Find the resource by ID
        const resource = await Resource.findById(req.params.id);
        if (!resource) {
            return res.status(404).send('Resource not found.');
        }

        // Delete the file from the file system
        fs.unlink(resource.filePath, async (err) => {
            if (err) {
                return res.status(500).send('Error deleting the file from the server.');
            }

            // Remove the resource entry from the database
            await Resource.findByIdAndRemove(req.params.id);
            res.send('Resource deleted successfully.');
        });
    } catch (err) {
        res.status(500).send('Error deleting resource.');
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

