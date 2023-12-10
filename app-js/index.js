const express = require('express');
const Multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const Firestore = require('@google-cloud/firestore');


const app = express();
const PORT = process.env.PORT || 8080;
const PROJECT_ID = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT
const BUCKET = process.env.BUCKET;

app.set('view engine', 'ejs');


const db = new Firestore({
  projectId: PROJECT_ID,
  timestampsInSnapshots: true
});
// Configure Google Cloud Storage
const storage = new Storage({
  projectId: PROJECT_ID 
});


const bucket = storage.bucket(BUCKET);

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

  app.get('/do-search', async (req,res)=>{
    const searchText = req.query.searchText;
    const cityRef = db.collection('tags').doc(searchText);
    const doc = await cityRef.get();
    let imageList = [];
    if (!doc.exists) {
      console.log('No such document!');
      res.status(404);
     } else {
      imageList = doc.data().photo_urls;
    }
    res.render('imageList', { imageList });
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
      const publicUrl = `https://storage.googleapis.com/${BUCKET}/${blob.name}`;
      // res.status(200).send(`Archivo subido, satisfactoriamente`);
      res.redirect('/');
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
