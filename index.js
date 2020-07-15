const wallpaper = require('wallpaper');
const readline = require('readline');
const { time } = require('console');
const { exec } = require('child_process');
const childProcess = require('child_process');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const fs = require("fs");
let checkPoint_path = __dirname + '/.log';
let readFile;
if (fs.existsSync(checkPoint_path))
    readFile = readline.createInterface({
        input: fs.createReadStream(checkPoint_path),
        output: process.output,
        console: false,
        terminal: false
    });
const { rejects } = require('assert');
const { resolve, dirname } = require('path');
//const { return } = require('q');

let imgPath = '/';
let date, current_hour, current_minute, current_second, photoNumber, imgFolder, readData = false, imgTime = new Array(), timeString, noError = true, errMsg, current_wallpaper = -1, extensions = new Array(), current_os = process.platform;
let commandString = '';
let finishedClassification = false;
let canLog = false;
let waitingForResponse = true;

var twirlTimer = (() => {
    var P = ["\\", "|", "/", "-"];
    var x = 0;
    return setInterval(() => {
        if(!waitingForResponse) {
            process.stdout.write("\r" + P[x++]);
            x &= 3;
        } 
    }, 250);
  })();

function runScript(scriptPath, callback) {

    // keep track of whether callback has been invoked to prevent multiple invocations
    var invoked = false;

    var process = childProcess.fork(scriptPath, [imgFolder]);

    // listen for errors as they may prevent the exit event from firing
    process.on('error', err => {
        if (invoked) return;
        invoked = true;
        callback(err);
    });

    // execute the callback once the process has finished running
    process.on('exit', code => {
        if (invoked) return;
        invoked = true;
        var err = code === 0 ? null : new Error('exit code ' + code);
        callback(err);
    });

}

function readData_() {
    canLog = true;
    rl.question("Number of photos you want to change in a day: ", n => {
        rl.question("Path to the images folder: ", folderPath => {
            if (fs.existsSync(folderPath)) {
                console.log('folder exists');
                fs.readdir(folderPath, (error, files) => {
                    if(files.length < n || files.length > n) {
                        errMsg = "'" + folderPath + "' must contain exactly " + n + ' images...';
                        noError = false;
                        return;
                    }
                    else for(let i = 0; i < files.length; i++) extensions.push(files[i].slice(files[i].indexOf('.')));
                });
                photoNumber = n;
                for(let i = 0; i < n; i++) imgTime.push(new Date());
                let queryString = "Speciy hours and minutes for when each wallpaper should be changed\n\nRequired format is: [hh min], [hh min], ... [hh min] (given in ascending order)\n\nFor example, if the number of images is 4, then a valid input could be: [10 20], [14 50], [18 32], [23 59]: ";
                rl.question(queryString, stringDates => {
                    imgFolder = folderPath;
                    timeString = stringDates;
                    readData = true;
                    // check whether the dates are valid or not;
                    if(datesAreValid()) {
                        saveData();
                        createService();
                        waitingForResponse = false;
                    }
                    rl.close();
                });
            }
            else {
                noError = false;
                errMsg = "'" + folderPath + "' does not exist...";
                return;
            }
        });
    });
}

function datesAreValid() {
    let k = 0, dd, x, y, c = 0, l_h, l_m;
    while(k < timeString.length) {
        if(timeString.charAt(k) != '[' || timeString.charAt(k + 6) != ']') {
            noError = false;
            errMsg = "Invalid format for given dates...";
            return;
        }
        dd = timeString.slice(k + 1, k + 6);
        k += 9;
        x = dd.slice(0, 2);
        x = parseInt(x, 10);
        y = dd.slice(3);
        y = parseInt(y, 10);
        if(x > 24 || x < 0) {
            noError = false;
            errMsg = x + ' is not a valid hour...';
            return false;
        }
        if(y > 60 || y < 0) {
            noError = false;
            errMsg = y + ' is not a valid minute...';
            return;
        }
        if(c && !correctOrder(x, y, l_h, l_m)) {
            errMsg = 'Dates must be in ascending order...';
            noError = false;
            return false;
        }
        l_h = x;
        l_m = y;
        try {
            imgTime[c].setHours(x, y);
            c++;
        } catch(e) {
            errMsg = e;
            noError = false;
            return false;
        }
    }
    if(c < photoNumber) {
        errMsg = "More dates needed...";
        noError = false;
        return false;
    }
    return true;
}

function saveData() {
    let save_txt = photoNumber + '\n' + imgFolder + '\n' + timeString;
    fs.writeFile(checkPoint_path, save_txt, function (err) {
        if (err) throw err;
        console.log('Saved!');
    });
}

function loadData() {
    let i = 1;
    readFile.on('line', line => {
        console.log(line);
        if(i == 1) photoNumber = line;
        if(i == 2) {
            imgFolder = line;
            fs.readdir(imgFolder, (error, files) => {
                if(error) throw error;
                for(let i = 0; i < files.length; i++) extensions.push(files[i].slice(files[i].indexOf('.')));
            });
        }
        if(i == 3) {
            let mustChange = false;
            timeString = line;
            readData = true;
            for(let i = 0; i < photoNumber; i++) imgTime.push(new Date());
            datesAreValid();
            rl.question("\nDo you want to reset the saved data? (y/n): ", r => {
                if(r.toLocaleLowerCase() == 'yes' || r.toLocaleLowerCase() == 'y') {
                    mustChange = true;
                    readData = false;
                    imgFolder = null;
                    readData_();
                    promiseImgFolder()
                    .then(() => {
                        // begin classifying images as soon as folder path has been given
                        console.log('began classyfing images...');
                        runScript(__dirname +  '/darkImageClassifier.js', err => {
                            if (err) throw err;
                            finishedClassification = true;
                            console.log('finished classifying images!');
                            console.log('may your eyes burn no more :)');
                            process.exit();
                        });
                    })
                    .catch(err => {
                        throw err;
                    });
                }
                else if(r.toLocaleLowerCase() == 'no' || r.toLocaleLowerCase() == 'n') {
                    console.log('well, then, have a nice day..:)');
                    process.exit();
                }
            });
            setTimeout(() => {
                if(!mustChange) {
                    console.log('n');
                    canLog = true;
                }
            }, 300000);
        }
        i++;
    });
}

function createService() {

    let serviceFilePath = '/etc/systemd/system/wallChange.service';
    let createServiceFile = 'sudo touch ' + serviceFilePath;
    let enableService = 'sudo systemctl enable ' + serviceFilePath;
    let startService = 'sudo systemctl start wallChange.service';
    let contentOfServiceFile = '[Unit]\nDescription=This service changes wallpapers during the day (wallChange)\n\n[Service]\nExecStart=' + __dirname + '/index.sh\nRestart=always\n\n[Install]\nWantedBy=multi-user.target';
    let conetntOfBashScript = '#!/bin/bash\n\nnode ' + __dirname + '/index.js';
    let makeBashScriptExecutable = 'sudo chmod +x ' + __dirname + '/index.sh';
    let insertServiceFileContent = 'sudo bash -c "echo' + " '" + contentOfServiceFile + "' > " + serviceFilePath + '"';
    let insertBashScriptContent = 'echo "' + conetntOfBashScript + '" > ' + __dirname + '/index.sh';
    
    commandString = insertBashScriptContent;
    promiseExecBashCommand()
    .then(() => {
        console.log('finished creating bash script');
        commandString = makeBashScriptExecutable;
        promiseExecBashCommand()
        .then(() => {
            console.log('made bash script executable!');
            commandString = createServiceFile;
            promiseExecBashCommand()
            .then(() => {
                console.log('finished creating service...');
                commandString = insertServiceFileContent;
                promiseExecBashCommand()
                .then(() => {
                    console.log('Created service file!');
                    commandString = enableService;
                    promiseExecBashCommand()
                    .then(() => {
                        console.log('enabled service!');
                        commandString = startService;
                        promiseExecBashCommand()
                        .then(() => {
                            console.log('started service!');
                        })
                        .catch(err => {
                            throw err;
                        });
                    })
                    .catch(err => {
                        throw err;
                    });
                })
                .catch(err => {
                    throw err;
                });
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
    })

    
}

function promiseExecBashCommand() {
    return new Promise((resolve, reject) => {
        execBashCommand(resolve, reject);
    });
}

function promiseImgFolder() {
    return new Promise((resolve, reject) => {
        setInterval(() => {
            if(imgFolder) resolve();
        }, 100);
    });
}

function execBashCommand(resolve, reject) {
    //console.log('executing `' + commandString + '`...');
    exec(commandString, (err, stdout, stderr) => {
        if (err) reject(err);
        else {
            //console.log('finished executing `' + commandString + '`!');
            // the *entire* stdout and stderr (buffered)
            //console.log(`stdout: ${stdout}`);
            //console.log(`stderr: ${stderr}`);
            resolve();
        }
    });
}

if(!runBefore()) {
    // data hasn't been read before or has to be read again
    readData_();
    if(!finishedClassification) {
        promiseImgFolder()
        .then(() => {
            // begin classifying images as soon as folder path has been given
            console.log('began classyfing images...');
            runScript(__dirname +  '/darkImageClassifier.js', err => {
                if (err) throw err;
                finishedClassification = true;
                console.log('finished classifying images!');
                console.log('may your eyes burn no more :)');
                process.exit();
            });
        })
        .catch(err => {
            throw err;
        });
    }
}
else {
    finishedClassification = true;
    loadData(); // it has already been run before, data must be reloaded from log file
}

function runBefore() {
    if (fs.existsSync(checkPoint_path)) return true; // file exists, so it was ran before
    return false;
}

function correctOrder(current_hour, current_minute, last_hour, last_minute) {
    if((current_hour > last_hour) || (current_hour == last_hour && current_minute > last_minute)) return true;
    return false;
}

function imageTurn() {
    date = new Date();
    current_hour = date.getHours();
    current_minute = date.getMinutes();
    current_second = date.getSeconds();
    for(let i = 0; i < photoNumber - 1; i++) {
        if((current_hour > imgTime[i].getHours()) || (current_hour == imgTime[i].getHours() && current_minute >= imgTime[i].getMinutes())) {
            if(current_hour < imgTime[i + 1].getHours()) return i;
            if(current_hour == imgTime[i + 1].getHours() && current_minute < imgTime[i + 1].getMinutes()) return i;
        }
    }
    return photoNumber - 1;
}

let interval = setInterval(() => {
    if(noError) {
        if(readData) {
            let t = imageTurn();
            if(t != current_wallpaper && finishedClassification) changeWallpaper(t);
        }
    }
    else throw errMsg;
}, 5000);

function changeWallpaper(p) {
    imgPath = imgFolder + '/' + p + extensions[p];
    try {
        wallpaper.set(imgPath);
    } catch(e) {
        throw e;
    }
    current_wallpaper = p;
    if(canLog) console.log('changed the wallpaper with image number ' + p);
    console.log('changed the wallpaper with image number ' + p);
}