import {cancel, cancelled, fork, put, take,call} from 'redux-saga/effects'
import {delay} from 'redux-saga'
import * as actions from '../actions'
import axios from "axios/index";
import toastr from 'toastr'
import {store} from '../App'
import {config} from "../service/http";
import parsePath from 'path-parse'
const electron = window.require('electron');
const fs = electron.remote.require('fs');
const path = electron.remote.require('path');
const os = electron.remote.require('os');
const readChunk = electron.remote.require('read-chunk');
const fileType = electron.remote.require('file-type');
const Store = electron.remote.require('electron-store');
axios.defaults.headers.post['Content-Type'] = 'application/x-www-form-urlencoded';
var ostype = os.platform()
var isWindow = ostype === "win32"? true: false


var folderStroe = null
var failureNum = 0
// 多线程数量队列控制
var subNum = 50
export function* uploadFeature() {
  while (yield take(actions.UPLOAD_FEATURE["REQUEST"])) {
    const bgSyncUploadFeature = yield fork(uploadFeature_)
    yield take(actions.UPLOAD_FEATURE["FAILURE"])
    yield cancel(bgSyncUploadFeature)
  }
}

function* uploadFeature_() {
  const {SERVER, UPLOAD} = store.getState();
  var server = SERVER;
  var upload = UPLOAD
  var url = "http://" + server.ip + ":" + server.port + config.api.addFeature
  yield put(actions.upload['success']({
    allNumber: 0,
    traversing: true,
    errorText: "",
    loading: true
  }))
  folderStroe = new Store({name: upload.path.replace(/[\\/:]/g,"_")})
  try {
    var images = yield call(walkDir,upload.path)
    yield put(actions.upload['success']({
      traversing: false,
    }))
    yield put(actions.upload['success']({allNumber: images.length}))
    var folderName = ""
    if (isWindow) {
      folderName = parsePath.win32(upload.path).base;
    }else  {
      folderName = parsePath(upload.path).base;
    }
    var failurePath = getFailurePath(upload.faildPath,folderName)
    failureNum = folderStroe.get("failureNum")
    for (var i = 0; i <= images.length - 1; i++) {
      // var parseName = {};
      // if (isWindow) {
      //   parseName = parsePath.win32(images[i])
      // }else  {
      //   parseName = parsePath(images[i])
      // }
      if(!folderStroe.has(images[i])) {
        yield fork(postImage,url,failurePath,images[i],upload.sublibId)
        // 控制fork的线程数，避免资源耗尽
        if((i+1) - folderStroe.size >=subNum) {
          yield  delay(100)
        }
      }

    }
    // 开启多线程 ，等待子线程结束
    while (folderStroe.size -1 < images.length) {
      yield delay(500)
    }
    yield put(actions.upload['success']({
      loading: false,
      traversing: false
    }))
  } catch (e) {
    toastr.error(e.message)
    yield put(actions.upload['success']({
      loading: false,
      errorText: e.message,
      traversing: false
    }))
  } finally {
    if (yield cancelled()) {
      // 手动取消任务
      yield delay(100)
      yield put(actions.upload['success']({
        allNumber: 0,
        loading: false,
        traversing: false,
      }))
    } else {
      // 任务处理结束，打通循环
      yield put(actions.upload_feature['failure']())
    }
  }
}
function* postImage(url,failurePath,imagePath,sublibId) {
  var parseName = {};
  if (isWindow) {
    parseName = parsePath.win32(imagePath)
  }else  {
    parseName = parsePath(imagePath)
  }
  try {
    var bolb = fs.readFileSync(imagePath);
    var file = new File([bolb], parseName.base, {type: "image/jpeg", path: imagePath});
    var formDate = new FormData();
    formDate.append("file", file);
    formDate.append("subid", sublibId);
    var {data} = yield axios.post(url, formDate)
    if (data.status) {
      folderStroe.set(imagePath, true)
      yield put(actions.upload['success']({savedNumber: folderStroe.size - failureNum}))
    } else {
      folderStroe.set(imagePath,false)
      folderStroe.set("failureNum",++failureNum)
      yield put(actions.upload['success']({failureNumber: failureNum - 1}))
      try {
        fs.accessSync(failurePath, fs.constants.F_OK);
      } catch (e) {
        fs.mkdirSync(failurePath);
      }
      copyFile(imagePath,path.join(failurePath + parseName.base));
    }
  } catch (e) {
    toastr.error(e.message)
    yield put(actions.upload['success']({
      errorText: e.message,
      loading: false,
      traversing: false
    }))
    yield put(actions.upload_feature['failure']())
  }

}
function copyFile(src, dest) {
  let readStream = fs.createReadStream(src);

  readStream.once('error', (err) => {
    toastr.error(err.message)
  });
  readStream.pipe(fs.createWriteStream(dest));
}
function getFailurePath(path,folderName) {
  var dirName = "上传失败图片_" + folderName
  var target = ""
  if (isWindow) {
    target = path + "\\" + dirName + "\\"
  } else {
    target = path + "/" + dirName + "/"
  }
  return target
}

function *walkDir(dir) {
  var results = []
  var files = fs.readdirSync(dir)
  var num = 0;
  for (var i= 0;i<files.length;i ++) {
    var name = files[i]
      var filePath = path.join(dir, name)
      var stat = fs.statSync(filePath)
      if (stat && stat.isDirectory()) {
        // var data = yield walkDir(filePath)
        // results = results.concat(data)
      } else {
        const buffer = readChunk.sync(filePath, 0, fileType.minimumBytes);
        var state = fileType(buffer);
        if (state && state.mime.indexOf("image") >= 0) {
          results.push(filePath)
          yield put(actions.upload['success']({allNumber: ++num}))
          if(num % 200 === 0) {
            yield delay(0)
          }
        }
      }
  }
  return results
}


