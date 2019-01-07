import {put, takeLatest,call,take,fork,cancel,cancelled} from 'redux-saga/effects'
import { delay } from 'redux-saga'
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


export function* getChannel() {
  yield takeLatest(actions.CHANNEL["REQUEST"], function* () {
    const {SERVER} = store.getState();
    try {
      const res = yield axios.get("http://" + SERVER.ip + ":" + SERVER.port + config.api.channelGet, {
        params: {
          nowPage: 1,
          pageSize: 999999
        }
      })
      if (res.status) {
        yield put(actions.channel['success']({channels: res.data.data.channels || []}))
      } else {
        yield put(actions.channel['success']({channels: []}))
      }
    } catch (e) {
      toastr.error(e.message);
    }
  })
}

export function* getSublib() {
  yield takeLatest(actions.SUBLIB["REQUEST"], function* () {
    const {SERVER} = store.getState();
    try {
      const res = yield axios.get("http://" + SERVER.ip + ":" + SERVER.port + config.api.getSublib, {
        params: {
          nowPage: 1,
          pageSize: 999999
        }
      })
      if (res.status) {
        yield put(actions.sublib['success']({sublibs: res.data.data.sublibs || []}))
      } else {
        yield put(actions.sublib['success']({sublibs: []}))
      }
    } catch (e) {
      toastr.error(e.message);
    }
  })
}

export function* exportLog() {
  while ( yield take(actions.EXPORT_LOG["REQUEST"]) ) {
    const bgSyncLog = yield fork(exportLog_)
    yield take(actions.EXPORT_LOG["FAILURE"])
    yield cancel(bgSyncLog)
  }
}

function * exportLog_() {
  const {SERVER, LOG} = store.getState();
  var server = SERVER;
  var log = LOG
  var url = "http://" + server.ip + ":" + server.port + config.api.getLog
  yield put(actions.log['success']({
    allNumber: 0,
    acquiredNumber: 0,
    savedNumber: 0,
    loading: true
  }))
  try {
    var {data} = yield axios.get(url, {
      params: {
        begin: log.begin,
        end: log.end,
        sort: log.sort,
        search_text: log.name,
        score_s: log.score_s,
        score_b: log.score_b,
        channel_id: log.channel_id,
        sublib_id: log.sublib_id,
        hit_count: log.hit_count,
        nowPage: 1,
        pageSize: 1,
      }
    })
    if (data.status) {
      var total = data.data.total
      if (total === 0) {
        yield put(actions.log['success']({
          allNumber: 0,
          acquiredNumber: 0,
          savedNumber: 0,
          loading: false,
        }))
        return toastr.success("暂无数据")
      }
      if (log.max !== "" && total > log.max) {
        total = log.max
      }
      var pageSize = Math.ceil(total / 15)
      if (pageSize < 100) {
        pageSize = 100
      }
      if (total <= 100) {
        pageSize = total
      }
      var num = Math.ceil(total / pageSize)
      var allLog = []
      yield put(actions.log['success']({allNumber: total}))
      for (var i = 0; i < num; i++) {
        var {data} = yield axios.get(url, {
          params: {
            begin: log.begin,
            end: log.end,
            sort: log.sort,
            search_text: log.name,
            score_s: log.score_s,
            score_b: log.score_b,
            channel_id: log.channel_id,
            sublib_id: log.sublib_id,
            hit_count: log.hit_count,
            nowPage: i + 1,
            pageSize: pageSize,
          }
        })
        allLog = allLog.concat(data.data.logs)
        yield put(actions.log['success']({acquiredNumber: allLog.length}))
      }
      // 防止在获取数据期间有新的数据添加进来
      yield put(actions.log['success']({allNumber: allLog.length}))
      yield call(saveData,allLog)
    } else {
      toastr.error(data.info)
    }
  } catch (e) {
    toastr.error(e.message)
    yield put(actions.log['success']({loading: false}))
  } finally {
    if (yield cancelled()) {
      // 手动取消任务
      yield delay(100)
      yield put(actions.log['success']({
        allNumber: 0,
        acquiredNumber: 0,
        savedNumber: 0,
        loading: false,
      }))
      rimraf(folderPath,err => err && toastr.error(err.message))
    } else {
      // 任务处理结束，打通循环
      yield put(actions.export_log['failure']())
    }
  }
}

function getPath() {
  var dirName = moment().format("YYYY-MM-DD_HH-mm-ss") + "_历史日志"
  const {LOG} = store.getState();
  var target = ""
  var ostype = os.platform()
  if (ostype === "windows") {
    target = LOG.path + "\\" + dirName + "\\"
  } else if (ostype === "linux") {
    target = LOG.path + "/" + dirName + "/"
  } else if (ostype === "darwin") {
    target = LOG.path + "/" + dirName + "/"
  } else {
    target = LOG.path + "/" + dirName + "/"
  }
  return target
}
function * saveData(v) {
  var dirName = getPath();
  folderPath = dirName
  const {SERVER, LOG} = store.getState();
  var server = SERVER;
  var log = LOG
  fs.mkdir(dirName, "0777", function (err) {
    if (err) {
      return toastr.error(err.message)
    }
  })
  var url = "http://" + server.ip + ":" + server.port

  try {
    for (var i = 0; i < v.length; i++) {
      if (log.logmode === "1" || log.logmode === "2") {
        var {data} = yield axios.get(url + v[i].CropFrame_data, {responseType: "arraybuffer"})
        var logName = v[i].Id + "_" + v[i].Channel_name + ".jpg"
          logName = logName.replace(/\//g,"")
        fs.writeFile(dirName + logName, new Buffer(data), (e) => {
          if (e) {
            toastr.error(e.message)
          }
        })
      }
      if ((log.logmode === "1" || log.logmode === "3") && v[i].Feature_id != 0) {
        var {data} = yield axios.get(url + v[i].Feature_data, {responseType: "arraybuffer"})
        var featureName = v[i].Id + "_" + v[i].Feature_name + "_" + v[i].Sublib + "_" + v[i].Score + ".jpg"
        featureName = featureName.replace(/\//g,"")
        fs.writeFile(dirName + featureName, new Buffer(data), (e) => {
          if (e) {
            toastr.error(e.message)
          }
        })
      }
      yield put(actions.log['success']({savedNumber: (i + 1)}))
    }
      yield put(actions.log['success']({loading: false}))
  } catch(e) {
    toastr.error(e.message)
    yield put(actions.log['success']({loading: false}))
  }

}