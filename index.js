// constants
const PORT = process.env.PORT || 3000;
const DIR = 'public';
const SUB_DIRECTORY = 'public/uploads';

// dependencies
const express = require('express');
const multer = require('multer');
const imageSize = require('image-size');
const sharp = require('sharp');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// create directories if they don't exist
if (!fs.existsSync(DIR)) {
  fs.mkdirSync(DIR);
  fs.mkdirSync(SUB_DIRECTORY);
}

// express app setup
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(DIR));

// multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, SUB_DIRECTORY);
  },
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/jpeg') {
    cb(null, true);
  } else {
    cb(null, false);
    return cb(new Error('Only.png,.jpg and.jpeg format allowed!'));
  }
};

const upload = multer({ storage, fileFilter: imageFilter });

// route handlers
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.post('/processimage', upload.single('file'), (req, res) => {
  const format = req.body.format;
  const width = parseInt(req.body.width);
  const height = parseInt(req.body.height);

  if (req.file) {
    console.log(req.file.path);

    if (isNaN(width) || isNaN(height)) {
      const dimensions = imageSize(req.file.path);
      console.log(dimensions);
      width = parseInt(dimensions.width);
      height = parseInt(dimensions.height);
    }

    processImage(req, res, width, height, format);
  }
});

// helper functions
function processImage(req, res, width, height, format) {
  const outputFilePath = `${Date.now()}output.${format}`;

  try {
    sharp(req.file.path)
     .resize(width, height)
     .toFile(outputFilePath, (err, info) => {
        if (err) {
          throw err;
        }
        res.download(outputFilePath, (err) => {
          if (err) {
            throw err;
          }
          fs.unlinkSync(req.file.path);
          fs.unlinkSync(outputFilePath);
        });
      });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error processing image');
  }
}

// start server
app.listen(PORT, () => {
  console.log(`App is listening on PORT ${PORT}`);
});
