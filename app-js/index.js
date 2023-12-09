const express = require('express');
const Multer = require('multer');
const { Storage } = require('@google-cloud/storage');

const app = express();
const PORT = process.env.PORT || 3030;

// Configure Google Cloud Storage
const storage = new Storage({
  projectId: 'your-project-id',
  keyFilename: 'path/to/your/service/account/keyfile.json',
});

const bucketName = 'your-bucket-name';
const bucket = storage.bucket(bucketName);

// Configure Multer for file uploads
const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Set up a simple form for file upload
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/search', (req, res) => {
    res.sendFile(__dirname + '/search.html');
  });
  

// Handle file upload
app.post('/upload', multer.single('file'), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).send('No file uploaded.');
    }

    const blob = bucket.file(file.originalname);
    const blobStream = blob.createWriteStream();

    blobStream.on('finish', () => {
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${blob.name}`;
      res.status(200).send(`File uploaded successfully. Public URL: ${publicUrl}`);
    });

    blobStream.end(file.buffer);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
