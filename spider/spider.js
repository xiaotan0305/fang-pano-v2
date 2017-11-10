//依赖模块
const fs = require('fs');
const request = require("request");
const mkdirp = require('mkdirp');
const viewData = require('./viewData.js');

let imgArr = [];
(function recurseData(data) {
    for (const key in data) {
        if (data.hasOwnProperty(key) === true) {
            if (key === 'ImagePath') {
                imgArr.push(data[key])
            } else {
                if (data[key] instanceof Array || data[key] instanceof Object) {
                    recurseData(data[key]);
                }
            }
        }
    }
})(viewData);

console.log(`从json中取到${imgArr.length}条数据`);

function getNow() {
    function formatDate(now) {
        var year = now.getFullYear();
        var month = now.getMonth() + 1;
        var date = now.getDate();
        var hour = now.getHours();
        var minute = now.getMinutes();
        var second = now.getSeconds();
        return `${year}-${month}-${date}_${hour}:${minute}:${second}`;
    }
    return formatDate(new Date())
}

// 本地存储目录
var dir = `images_${getNow()}`;

//创建目录
mkdirp('./images/' + dir, function (err) {
    if (err) {
        console.log('文件夹创建失败:', err);
    }
});

//下载方法
var download = function (url, dir, filename) {
    request.head(url, function (err, res, body) {
        request(url).pipe(fs.createWriteStream(dir + "/" + filename));
        checkDone();
    });
};

var index = 0;
function checkDone() {
    index++;
    if (index === imgArr.length) {
        console.log('下载完成');
    }
}

// download(encodeURIComponent('http://vrhouse.oss-cn-shanghai.aliyuncs.com/22544f76-25cf-42db-aa44-53f309567dcd/RoomFaces/客厅_face_0.png').replace('%3A%2F%2F', '://').replace(/%2F/g, '/'), './images/', '1.jpg');


// 发送请求
let count = 0;
imgArr.forEach(ele => {
    const filePathArr = ele.split('/');
    const slashLen = filePathArr.length;
    const fileName = filePathArr[slashLen - 1];
    const fileFolder = filePathArr[slashLen - 2];
    count++;
    mkdirp('./images/' + dir + '/' + fileFolder);
    const url = encodeURIComponent(ele).replace('%3A%2F%2F', '://').replace(/%2F/g, '/');
    setTimeout(() => {
        console.log('开始下载:', ele);
        download(url, `./images/${dir}/${fileFolder}`, fileName);
    }, 50 * count);
});


