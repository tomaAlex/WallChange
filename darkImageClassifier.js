const fs = require('fs');
const { resolve } = require('path');
const { reject } = require('q');
const { Console } = require('console');
const gm = require('gm').subClass({imageMagick: true});
const PNG = require("pngjs").PNG;
let pathToFolder = process.argv[2]; // allow path to be given as parameter from shell
let pathToImage = '';
let fileNames = new Array();
let files; // save files from given directory in global variable
           // so that promises can execute after `readdir` method
let fileScores = new Array();

function promiseImageScore() {
  return new Promise((resolve, reject) => {
    getImageScore(resolve, reject);
  }); 
}

function prmoiseSavingFileNames() {
  return new Promise((resolve, reject) => {
    addFileNames(resolve, reject);
  });
}

function promiseReadingDir() {
  return new Promise((resolve, reject) => {
    readDir(resolve, reject);
  });
}

function promiseSaveAllTheScores() {
  return new Promise((resolve, reject) => {
    saveAllTheScores(resolve, reject);
  });
}

function promiseOrderImagesByScore() {
  return new Promise((resolve, reject) => {
    orderImagesByScore(resolve, reject);
  });
}

function promiseRenameFilesInOrder() {
  return new Promise((resolve, reject) => {
    renameFilesInOrder(resolve, reject);
  });
}

function getImageScore(resolve, reject) {
  let img = gm(pathToImage);
  // Get the PNG buffer
  img.toBuffer("PNG", (err, buff) => {
    if (err) return reject(err);
    // Get the image size
    img.size((err, size) => {
      if (err) {
        console.log(err);
        return reject(err);
      }
      // Parse the PNG buffer
      let str = new PNG();
      str.end(buff);
      // After it's parsed...
      str.on("parsed", buffer => {
        // Get the pixels from the image
        let idx, score = 0, rgb = {r: 0, g: 0, b: 0};

        for (let y = 0; y < size.height; y++)
          for (let x = 0; x < size.width; x++) {
            idx = (size.width * y + x) << 2;
            rgb.r = buffer[idx];
            rgb.g = buffer[idx + 1];
            rgb.b = buffer[idx + 2];
            score += (rgb.r + rgb.g + rgb.b) / 765;
          }
          return resolve(score / (size.height * size.width));
      });
      str.on("error", e => {
        return reject(e);
      });
    });
  });
}

function checkAllScoresAreSaved() {
  if(fileScores.length != fileNames.length) return false;
  for(let i = 0; i < fileScores.length; i++)
    if(fileScores[i] < 0) return false;
  return true;
}

function checkScoresAreOrdered() {
  for(let i = 0; i < fileScores.length - 1; i++)
    if(fileScores[i] < fileScores[i + 1]) return false;
  return true;
}

function saveAllTheScores(resolve, reject) {
    for(let i = 0; i < fileNames.length; i++) {
        pathToImage = fileNames[i];
        let localIndex = i;
        fileScores.push(-1);
        promiseImageScore()
        .then(imageScore => {
          fileScores[localIndex] = imageScore;
          if(checkAllScoresAreSaved()) resolve();
        })
        .catch(e => {
          throw e;
        });
    }
}

function addFileNames(resolve, reject) {
  files.forEach(file => {
    pathToImage = pathToFolder + '/' + file;
    fileNames.push(pathToImage);
    if(files.length == fileNames.length) {
      resolve();
      return;
    }
  });
}

function readDir(resolve, reject) {
  // see which images are to be found in the specificd directory
  fs.readdir(pathToFolder, (err, Files) => {
      if (err) return reject('Unable to scan directory: ' + err);
      files = Files;
      if(files) resolve();
      else reject(new Error('could not load files from the given directory path...'));
  });
}

function orderImagesByScore(resolve, reject) {
  // order them in descending order
  // the brigthest image has to be the first one
  // the darkes image has to be the last one
  for(let i = 0; i < fileScores.length - 1; i++)
    for(let j = i + 1; j < fileScores.length; j++) {
      if(fileScores[i] < fileScores[j]) {
        let aux = fileScores[i];
        fileScores[i] = fileScores[j];
        fileScores[j] = aux;
        aux = fileNames[i];
        fileNames[i] = fileNames[j];
        fileNames[j] = aux;
        // check if the scores are orderd in the if, as well,
        // to avoid not checking the last state of the vector
        if(checkScoresAreOrdered()) resolve();
      }
      if(checkScoresAreOrdered()) resolve();
    }
}

function renameFilesInOrder(resolve, reject) {
  for(let i = 0; i < fileNames.length; i++) {
    let extenstion = fileNames[i].slice(fileNames[i].indexOf('.'));
    let newName = pathToFolder + '/' + i + extenstion;
    fs.rename(fileNames[i], newName, err => {
      if (err) reject(err);
      else if(i == fileNames.length - 1) resolve();
    });
  }
}

promiseReadingDir()
.then(() => {
  console.log('finished reading dir files...');
  prmoiseSavingFileNames()
  .then(() => {
    console.log('saved all the file names!');
    promiseSaveAllTheScores()
    .then(() => {
      console.log('saved scores of the files');
      promiseOrderImagesByScore()
      .then(() => {
        console.log('ordered images by score');
        promiseRenameFilesInOrder()
        .then(() => {
          console.log('renamed files in the right order!');
        })
        .catch(err => {
          console.error(err);
        })
      })
      .catch(err => {
        throw err;
      })
    })
    .catch(err => {
      throw err;
    })
  })
  .catch(err => {
    throw err;
  });
})
.catch(err => {
  throw err;
});