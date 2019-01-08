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
var isWindow = ostype.indexOf("win") >= 0? true: false
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
    loading: true
  }))
  var electronStore = new Store({name: upload.path.replace(/\//g, "_")})
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
    var fNum = electronStore.get("failureNum")
    for (var i = 0; i <= images.length - 1; i++) {
      var parseName = {};
      if (isWindow) {
        parseName = parsePath.win32(images[i])
      }else  {
        parseName = parsePath(images[i])
      }
      if(!electronStore.has(parseName.name)) {
        console.log(images[i])
        var bolb = fs.readFileSync(images[i]);
        var file = new File([bolb], parseName.base, {type: "image/jpeg", path: images[i]});
        var formDate = new FormData();
        formDate.append("file", file);
        formDate.append("subid", upload.sublibId);
        var {data} = yield axios.post(url, formDate)
        if (data.status) {
          electronStore.set( parseName.name, true)
          yield put(actions.upload['success']({savedNumber: electronStore.size - fNum}))
        } else {
          electronStore.set(parseName.name,false)
          electronStore.set("failureNum",++fNum)
          yield put(actions.upload['success']({failureNumber: fNum - 1}))
          try {
            fs.accessSync(failurePath, fs.constants.F_OK);
          } catch (e) {
            fs.mkdirSync(failurePath);
          }
          copyFile(images[i],path.resolve(failurePath + parseName.base));
        }
      }

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
        var data = yield walkDir(filePath)
        results = results.concat(data)
      } else {
        const buffer = readChunk.sync(filePath, 0, fileType.minimumBytes);
        var state = fileType(buffer);
        if (state && state.mime.indexOf("image") >= 0) {
          results.push(filePath)
          yield put(actions.upload['success']({allNumber: ++num}))
          yield delay(0)
        }
      }
  }
  return results
}


