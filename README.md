# WallChange 🧱
This code is aimed for other Linux users out there 🖥, who want bright wallpapers during the day 🌞, but don't want their eyes to burn during midnight 🌘
# How to use it ⁉️
1. Create a folder 📁 somewhere and save your loved images 🖼️ (these would be the wallpapers changed in the meantime )
2. Clone this repository 
3. Install all the dependencies 💉
4. Run 🏃 `index.js` file 🗃️ with su privileges 
5. Follow the given instructions by the script 📜
6. Wait a little ⏲️ for the images to be orderd by brightness level and to be renamed, as well
# Cloning this repository 👶
Go somewhere in your computer where to store this project, open up a terminal 👨‍💻 from there and run 🏃 `git clone https://github.com/tomaAlex/WallChange.git`. Just 💿 `cd WallChange` into it and follow the next step. 
# Installing dependencies 💉
You need to have `npm` installed. Check whether or not you have `npm` installed with `check npm` ✅. If not, then install it ❗If you are coming from a Debian distro, then you could simply `sudo apt install npm` 🥴. After that, just `npm i` and wait for all the dependencies to get installed. Now, it would also be a good time to isntall the `imagemagick` packet. On Debian: `sudo apt install imagemagick`.
# Running this code 🏃
As mentioned, you have to run the script 📜 with su privileges, as it needs them, in order to create the `wallChange.service` service, which runs this script automatically at boot time 🤯. Therefore: `sudo node index.js`. Also, make sure you have the `nodejs` package installed on your system 😂. If not, install it. On Debian, it's really simple: `sudo apt install nodejs`. 🤟
# Do what the script says to 🙆
1. Mention the number of images 🔢 which are to be found in the given folder 📂
2. Paste the absolute path of the mentioned directory 😁
3. Mention every hour when images should start (in the required format). For sample, if you were to have a folder with 3 images in it, then you could input something like: `[08 30], [13 05], [17 45]`, which would mean that the first image would run from 8:30 am 🕣, untill 1:05 pm 🕐. From 1:05 pm 🕐, the second image would be set as the wallpaper, untill it gets to 5:45 pm 🕠, when the third image is set as the wallpaper, untill the next day, at 8:30 am 🕣, when the first image would be run again. This cycle keeps goiung forever... 🔄
# Voila! 🥳
After executing the script, you don't have to worry anymore about executing it ever again 😊, as it created a service, which makes it to run automatically at boot time 🤯. Therefore, your chosen wallpapers would change everyday as you told it the first time 💃
# Can I ever change the images which are set on my wallpaper? 😱
Of course you can! 🙃 You just have to run the `index.js` file again with su privileges and choose the other settings you want 😉
# Want to buy me a coffee? ☕
[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.me/tomaAlex2608)
