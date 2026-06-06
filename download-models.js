const fs = require('fs');
const https = require('https');
const path = require('path');

const modelsDir = path.join(__dirname, 'public', 'models');

if (!fs.existsSync(modelsDir)){
    fs.mkdirSync(modelsDir, { recursive: true });
}

const baseUrl = 'https://raw.githubusercontent.com/vladmandic/face-api/master/model/';
const files = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1',
];

files.forEach(file => {
  const dest = path.join(modelsDir, file);
  if (!fs.existsSync(dest)) {
    console.log(`Downloading ${file}...`);
    const fileStream = fs.createWriteStream(dest);
    https.get(baseUrl + file, function(response) {
      if (response.statusCode === 200) {
        response.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          console.log(`Finished ${file}`);
        });
      } else {
        console.error(`Failed to download ${file}: ${response.statusCode}`);
      }
    }).on('error', function(err) {
      fs.unlink(dest, () => {});
      console.error(`Error downloading ${file}: ${err.message}`);
    });
  } else {
    console.log(`File ${file} already exists.`);
  }
});
