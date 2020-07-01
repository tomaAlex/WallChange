const wallpaper = require('wallpaper');
const readline = require('readline');
const { time } = require('console');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
const fs = require("fs");

let imgPath = '/';
let date, current_hour, current_minute, current_second, photoNumber, imgFolder, readData = false, imgTime = new Array(), timeString, noError = true, errMsg, current_wallpaper = -1, extensions = new Array();

rl.question("Number of photos you want to change in a day: ", n => {
    rl.question("Path to the images folder: ", folderPath => {
        if (fs.existsSync(folderPath)) {
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
                // check whether the dates are valid or not
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
                        return;
                    }
                    if(y > 60 || y < 0) {
                        noError = false;
                        errMsg = y + ' is not a valid minute...';
                        return;
                    }
                    if(c && !correctOrder(x, y, l_h, l_m)) {
                        errMsg = 'Dates must be in ascending order...';
                        noError = false;
                        return;
                    }
                    l_h = x;
                    l_m = y;
                    try {
                        imgTime[c].setHours(x, y);
                        c++;
                    } catch(e) {
                        errMsg = e;
                        noError = false;
                        return;
                    }
                }
                if(c < photoNumber) {
                    errMsg = "More dates needed...";
                    noError = false;
                    return;
                }
                rl.close();
            });
        }
        else {
            noError = false;
            errMsg = "'" + folderPath + "' does not exist...";
        }
    });
});

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
            if(t != current_wallpaper) changeWallpaper(t);
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
    console.log('changed the wallpaper with image number ' + p);
}
