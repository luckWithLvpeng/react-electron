import {call, cancel, cancelled, fork, put, take} from 'redux-saga/effects'
import {delay} from 'redux-saga'
import * as actions from '../actions'
import axios from "axios/index";
import {config} from '../service/http'
import toastr from 'toastr'
import {store} from '../App'
import moment from "moment/moment";

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const os = electron.remote.require('os');
const rimraf = electron.remote.require('rimraf');

var folderPath = ""

export function* exportFeature() {
  while ( yield take(actions.EXPORT_FEATURE["REQUEST"]) ) {
    const bgSyncFeature = yield fork(exportFeature_)
    yield take(actions.EXPORT_FEATURE["FAILURE"])
    yield cancel(bgSyncFeature)
  }
}

function * exportFeature_() {
  const {SERVER, FEATURE} = store.getState();
  var server = SERVER;
  var feature = FEATURE
  var url = "http://" + server.ip + ":" + server.port + config.api.getFeature
  yield put(actions.feature['success']({
    allNumber: 0,
    acquiredNumber: 0,
    savedNumber: 0,
    loading: true
  }))
  try {
    var {data} = yield axios.get(url, {
      params: {
        status: feature.status,
        sublibId: feature.sublibId,
        searchText: feature.name,
        nowPage: 1,
        pageSize: 1,
      }
    })
    if (data.status) {
      var total = data.data.total
      if (total === 0) {
        yield put(actions.feature['success']({
          allNumber: 0,
          acquiredNumber: 0,
          savedNumber: 0,
          loading: false,
        }))
        return toastr.success("暂无数据")
      }
      if (feature.max !== "" && total > feature.max) {
        total = feature.max
      }
      var pageSize = Math.ceil(total / 15)
      if (pageSize < 100) {
        pageSize = 100
      }
      if (total <= 100) {
        pageSize = total
      }
      var num = Math.ceil(total / pageSize)
      var allFeature = []
      yield put(actions.feature['success']({allNumber: total}))
      for (var i = 0; i < num; i++) {
        var {data} = yield axios.get(url, {
          params: {
            status: feature.status,
            sublibId: feature.sublibId,
            searchText: feature.name,
            nowPage: i + 1,
            pageSize: pageSize,
          }
        })
        allFeature = allFeature.concat(data.data.features)
        yield put(actions.feature['success']({acquiredNumber: allFeature.length}))
      }
      // 防止在获取数据期间有新的数据添加进来
      yield put(actions.feature['success']({allNumber: allFeature.length}))
      yield call(saveData,allFeature)
    } else {
      toastr.error(data.info)
    }
  } catch (e) {
    toastr.error(e.message)
    yield put(actions.feature['success']({loading: false}))
  } finally {
    if (yield cancelled()) {
      // 手动取消任务
      yield delay(100)
      yield put(actions.feature['success']({
        allNumber: 0,
        acquiredNumber: 0,
        savedNumber: 0,
        loading: false,
      }))
      rimraf(folderPath,err => err && toastr.error(err.message))
    } else {
      // 任务处理结束，打通循环
      yield put(actions.export_feature['failure']())
    }
  }
}

function getPath() {
  var dirName = moment().format("YYYY-MM-DD_HH-mm-ss") + "_底库图片"
  const {FEATURE} = store.getState();
  var target = ""
  var ostype = os.platform()
  if (ostype === "windows") {
    target = FEATURE.path + "\\" + dirName + "\\"
  } else if (ostype === "linux") {
    target = FEATURE.path + "/" + dirName + "/"
  } else if (ostype === "darwin") {
    target = FEATURE.path + "/" + dirName + "/"
  } else {
    target = FEATURE.path + "/" + dirName + "/"
  }
  return target
}
function * saveData(v) {
  var dirName = getPath();
  folderPath = dirName
  const {SERVER} = store.getState();
  var server = SERVER;
  fs.mkdir(dirName, "0777", function (err) {
    if (err) {
      return toastr.error(err.message)
    }
  })
  var url = "http://" + server.ip + ":" + server.port
  var allName = {}
  try {
    for (var i = 0; i < v.length; i++) {
      var {data} = yield axios.get(url + v[i].Img_s, {responseType: "arraybuffer"})
      if (allName[(v[i].Name)] !== undefined) {
        fs.writeFile(dirName + v[i].Name + "(" + allName[v[i].Name] + ")" + ".jpg", new Buffer(data), (e) => {
          if (e) {
            toastr.error(e.toString())
          }
        })
        allName[(v[i].Name)] += 1
      } else  {
        fs.writeFile(dirName + v[i].Name + ".jpg", new Buffer(data), (e) => {
          if (e) {
            toastr.error(e.toString())
          }
        })
        allName[(v[i].Name)] = 1;
      }
      yield put(actions.feature['success']({savedNumber: (i + 1)}))
    }
    yield put(actions.feature['success']({loading: false}))
  } catch(e) {
    toastr.error(e.message)
    yield put(actions.feature['success']({loading: false}))
  }

}