import {all, call, put, race, select, take} from 'redux-saga/effects'
import * as actions from '../actions'
import axios from "axios/index";
import toastr from 'toastr'
import {config} from "../service/http";
import parsePath from 'path-parse'
import moment from 'moment';
import {Base64} from 'js-base64';

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');
const os = electron.remote.require('os');
const readChunk = electron.remote.require('read-chunk');
const fileType = electron.remote.require('file-type');
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
var ostype = os.platform()
var isWindow = ostype === "win32" ? true : false
//全局状态变量
let dataArr = []
let errFile = []
let logStr = ""
let requestErrNum = 0
let requestOkNum = 0
let loading = true
let complete = false
// 多线程数量队列控制
var subNum = 8
// 特征数据文档存储最大条目
let maxNum = 1000

export function* requestFeature() {
    while (true) {
        const {
            payload
        } = yield take(actions.REQUEST_FEATURE["REQUEST"])
        const {
            imgPath,
            savePath
        } = payload
        yield race({
            task: call(extractFeature_, imgPath, savePath),
            cancel: take(actions.REQUEST_FEATURE["FAILURE"])
        })

    }
}

function* extractFeature_(imgPath, savePath) {
    const {
        SERVER
    } = yield select();
    try {
        let server = SERVER;
        let url = "http://" + server.ip + ":" + server.port + config.api.extractImageFeature
        const images = yield call(walkDir, imgPath);
        let imgNum = images.length
        //清状态

        initGlobalData(true)
        let now = moment().format("YYYY-MM-DD HH:mm:ss")
        logStr += now + " ----获取特征任务启动\r\n"
        if (imgNum === 0) {
            toastr.error("文件夹中没有图片")
            yield put(actions.request_feature["failure"])
        } else {
            yield put(actions.request_feature["success"]({
                imgNum,
                requestOkNum,
                requestErrNum,
                loading,
                complete
            }))
        }
        //多线程请求数据
        for (let i = 0; i < imgNum;) {
            let processNum = imgNum - i > subNum ? subNum : imgNum - i
            //
            yield all(
                new Array(processNum).fill(1).map((v, j) => (
                    call([this, postImage], url, images[i + j])
                ))
            )
            //保存数据
            yield call(exportData, imgPath, savePath)
            i = i + subNum
            initGlobalData(false)
        }
        loading = false
        complete = true
        yield put(actions.request_feature["success"]({
            loading,
            complete
        }))
        toastr.success("获取特征任务完成")
    } catch (e) {
        toastr.error(e.message)
    } finally {
        try {
            let now = moment().format("YYYY-MM-DD HH:mm:ss")
            logStr += now + " ----获取特征任务结束\r\n"
            let today = moment().format("YYYY-MM-DD")
            let logPath = yield call(makeFilePath, imgPath, today + "_log.log")
            writeDataToFile(logPath, logStr)
        } catch (err) {
            toastr.error("日志保存出错")
        }

    }
}

//异步获取特征ß
function* postImage(url, imagePath) {
    let parseName = {};
    if (isWindow) {
        parseName = parsePath.win32(imagePath)
    } else {
        parseName = parsePath(imagePath)
    }

    var bolb = fs.readFileSync(imagePath);
    var file = new File([bolb], parseName.base, {
        type: "image/jpeg",
        path: imagePath
    });
    var formDate = new FormData();
    formDate.append("file", file);
    //数据请求
    let {
        data: payload
    } = yield axios.post(url, formDate)
    // yield delay(20)
    let now = moment().format("YYYY-MM-DD HH:mm:ss")
    //数据缓存
    if (payload.status) {
        dataArr.push(payload.data)
        logStr += now + " ----" + parseName.base + ",获取特征数据,成功\r\n"
        requestOkNum++
        yield put(actions.request_feature["success"]({
            requestOkNum
        }))

    } else {
        errFile.push({
            time: now,
            path: imagePath,
            base: parseName.base
        })
        logStr += now + " ----" + parseName.base + ",获取特征数据,失败\r\n"
        requestErrNum++
        yield put(actions.request_feature["success"]({
            requestErrNum
        }))
    }

}

function initGlobalData(all) {
    if (all) {
        dataArr = []
        errFile = []
        logStr = ""
        requestErrNum = 0
        requestOkNum = 0
        loading = true
        complete = false
    } else {
        dataArr = []
        errFile = []

    }

}

//本地存储日志及特征数据
function* exportData(imgPath, savePath) {
    //错误处理
    if (errFile.length > 0) {
        let failurePath = yield call(makeNewPath, imgPath, "errorImgs")
        errFile.forEach(v => {
            let failureFile = failurePath + v.base
            let now = moment().format("YYYY-MM-DD HH:mm:ss")
            fs.copyFile(v.path, failureFile, function (err) {
                if (err) {

                    logStr += now + " ----" + v.base + ",复制获取特征失败的图片失败，失败消息：" + err + "\r\n"
                    throw err
                } else {
                    logStr += now + " ----" + v.base + ",复制获取特征失败的图片成功\r\n"
                }
            })
        })
    }

    //特征保存
    if (dataArr.length > 0) {
        let featureLog = ""
        dataArr.forEach(v => {
            const {
                Image_feature,
                ...header
            } = v
            featureLog += Base64.encode(JSON.stringify(header)) + '\r' + Image_feature + '\r\n'
        })
        let target = yield call(getSaveFilePath, savePath, dataArr.length)
        yield call(writeDataToFile, target, featureLog)
        let now = moment().format("YYYY-MM-DD HH:mm:ss")
        let storeFiles = dataArr.map(v => v.File_name)
        logStr += now + " ----" + storeFiles + ",保存特征数据,成功\r\n"
    }


}


function makeNewPath(path, dirName) {
    var target = ""
    if (isWindow) {
        target = path + "\\" + dirName + "\\"
    } else {
        target = path + "/" + dirName + "/"
    }
    try {
        fs.accessSync(target, fs.constants.F_OK);
    } catch (e) {
        fs.mkdirSync(target);
    }
    return target
}

function makeFilePath(path, filename) {
    var target = ""
    if (isWindow) {
        target = path + "\\" + filename
    } else {
        target = path + "/" + filename
    }
    return target
}


function walkDir(dir) {
    var results = []
    var files = fs.readdirSync(dir)
    for (var i = 0; i < files.length; i++) {
        var name = files[i]
        var filePath = path.join(dir, name)
        var stat = fs.statSync(filePath)
        if (stat && stat.isDirectory()) {
        } else {
            const buffer = readChunk.sync(filePath, 0, fileType.minimumBytes);
            var state = fileType(buffer);
            if (state && state.mime.indexOf("image") >= 0) {
                results.push(filePath)
            }
        }
    }
    return results
}

//获取保存特征文件路径
function getSaveFilePath(savePath, offset) {
    let filename, target
    let files = fs.readdirSync(savePath)
    let today = moment().format("YYYY-MM-DD")
    let todayFiles = files.filter(v => (v.indexOf(today) === 0 && v.indexOf(".fea") >= 0))
    if (todayFiles.length === 0) {
        filename = today + "_1.fea"
        target = makeFilePath(savePath, filename)

    } else {
        let indexs = todayFiles.map(v => v.replace(".fea", "").split("_")[1])
        let last = Math.max(...indexs)
        filename = today + "_" + last + ".fea"
        target = makeFilePath(savePath, filename)
        let datas = fs.readFileSync(target).toString();
        let len = datas.toString().split('\n').length;
        if (len + offset >= maxNum) {
            last++
            filename = today + "_" + last + ".fea"
            target = makeFilePath(savePath, filename)
        }
    }

    return target
}

function writeDataToFile(dir, body) {

    fs.appendFile(dir, body, "utf8", function (err) {
        if (err) {
            throw err
        }
    });

}