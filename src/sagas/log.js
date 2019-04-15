import { cancel, cancelled, fork, put, take, takeLatest } from 'redux-saga/effects'
import { delay } from 'redux-saga'
import * as actions from '../actions'
import axios from "axios/index";
import { config } from '../service/http'
import toastr from 'toastr'
import { store } from '../App'
import moment from "moment/moment";

const electron = window.require('electron');
const fs = electron.remote.require('fs');
const os = electron.remote.require('os');
const rimraf = electron.remote.require('rimraf');

var folderPath = ""

// 保存已经读取的数据
var savedNumber = 0
// 缓存的线程数
var subNum = 50

var logStr =""
export function* getChannel() {
  yield takeLatest(actions.CHANNEL["REQUEST"], function* () {
    const { SERVER } = store.getState();
    try {
      const res = yield axios.get("http://" + SERVER.ip + ":" + SERVER.port + config.api.channelGet, {
        params: {
          nowPage: 1,
          pageSize: 999999
        }
      })
      if (res.status) {
        yield put(actions.channel['success']({ channels: res.data.data.channels || [] }))
      } else {
        yield put(actions.channel['success']({ channels: [] }))
      }
    } catch (e) {
      toastr.error(e.message);
    }
  })
}

export function* getSublib() {
  yield takeLatest(actions.SUBLIB["REQUEST"], function* () {
    const { SERVER } = store.getState();
    try {
      const res = yield axios.get("http://" + SERVER.ip + ":" + SERVER.port + config.api.getSublib, {
        params: {
          nowPage: 1,
          pageSize: 999999
        }
      })
      if (res.status) {
        yield put(actions.sublib['success']({ sublibs: res.data.data.sublibs || [] }))
      } else {
        yield put(actions.sublib['success']({ sublibs: [] }))
      }
    } catch (e) {
      toastr.error(e.message);
    }
  })
}

export function* exportLog() {
  while (yield take(actions.EXPORT_LOG["REQUEST"])) {
    const bgSyncLog = yield fork(exportLog_)
    yield take(actions.EXPORT_LOG["FAILURE"])
    yield cancel(bgSyncLog)
  }
}

function* exportLog_() {
  const { SERVER, LOG } = store.getState();
  var server = SERVER;
  var log = LOG
  var url = "http://" + server.ip + ":" + server.port + config.api.getLog
  logStr=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+"导出历史日志任务开始\r\n"
  yield put(actions.log['success']({
    allNumber: 0,
    acquiredNumber: 0,
    savedNumber: 0,
    error: "",
    loading: true
  }))
  try {
    var { data } = yield axios.get(url, {
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
      yield put(actions.log['success']({ allNumber: total }))
      for (var i = 0; i < num; i++) {
        var { data } = yield axios.get(url, {
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
        yield put(actions.log['success']({ acquiredNumber: allLog.length }))
      }
      // 防止在获取数据期间有新的数据添加进来
      yield put(actions.log['success']({ allNumber: allLog.length }))
      var allNumber = allLog.length
      folderPath = getPath();
      try {
        fs.accessSync(folderPath, fs.constants.F_OK);
      } catch (e) {
        fs.mkdirSync(folderPath);
      }
      savedNumber = 0;
      var url = "http://" + server.ip + ":" + server.port
      // yield call(saveData,allLog)
      for (var i = 0; i < allNumber; i++) {
        yield fork(saveData, url, allLog[i], log.logmode, folderPath)
        // 控制fork的线程数，避免资源耗尽
        while ((i + 1) - savedNumber >= subNum) {
          yield delay(200)
        }
      }
      // 开启多线程 ，等待子线程结束
      while (savedNumber < allNumber) {
        yield delay(200)
      }
      yield put(actions.log['success']({ loading: false }))
    } else {
      toastr.error(data.info)
      yield put(actions.log['success']({ error: data.info }))
    }
  } catch (e) {
    toastr.error(e.message)
    yield put(actions.log['success']({ loading: false, error: e.message }))
  } finally {
    logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------导出历史日志任务结束\r\n"
    fs.writeFile(folderPath + "/log.log", logStr, (e) => {
      if (e) {
        toastr.error(e.message)
      }
    })
    if (yield cancelled()) {
      // 手动取消任务
      yield delay(100)
      yield put(actions.log['success']({
        allNumber: 0,
        acquiredNumber: 0,
        savedNumber: 0,
        loading: false,
      }))
      if (folderPath && !(store.getState().LOG.error)) {
        rimraf(folderPath, err => err && toastr.error(err.message))
      }
    } else {
      // 任务处理结束，打通循环
      yield put(actions.export_log['failure']())
    }
  }
}

function getPath() {
  var dirName = moment().format("YYYY-MM-DD_HH-mm-ss") + "_历史日志"
  const { LOG } = store.getState();
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

function* saveData(url, log, logmode, dirName) {
  try {
    var now = log.Time
    if (logmode === "1" || logmode === "2" || logmode === "4") {
      var { data } = yield axios.get(url + log.CropFrame_data, { responseType: "arraybuffer" })
      if (data.byteLength > 2000) {
        var logName = log.Id + "_" + log.Channel_name + "_" + now + ".jpg"
        logName = logName.replace(/[\/:]/g, "_")
        fs.writeFile(dirName + logName, new Buffer(data), (e) => {
          if (e) {
            toastr.error(e.message)
            logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+logName+"存储失败:"+e.message+"\r\n"
          }else{
            logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+logName+"存储成功\r\n"
          }
        })
      } else {
        logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+log.Id + "_" + log.Channel_name + "_" + now +"无采集图\r\n"
      }

    }
    if ((logmode === "1" || logmode === "3" || logmode === "4") && log.Feature_id != 0) {
      var { data } = yield axios.get(url + log.Feature_data, { responseType: "arraybuffer" })
      if (data.byteLength > 2000) {
       
        var featureName = log.Id + "_" + log.Feature_name + "_" + log.Sublib + "_" + log.Score + "_" + now + ".jpg"
        featureName = featureName.replace(/[\/:]/g, "_")
        fs.writeFile(dirName + featureName, new Buffer(data), (e) => {
          if (e) {
            toastr.error(e.message)
            logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+featureName+"存储失败:"+e.message+"\r\n"
          }else{
            logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+featureName+"存储成功\r\n"
          }
        })
      } else {
        logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+log.Id + "_" + log.Channel_name + "_" + now +"无底层图\r\n"
      }
    }
    if ((logmode === "4" || logmode === "5") && log.Feature_id != 0) {
      var { data } = yield axios.get(url + "/v1/log/sceneImg/" + log.Id, { responseType: "arraybuffer" })
      if (data.byteLength > 2000) {
        var sceneName = log.Id + "_" + log.Channel_name + "_" + now + "_场景.jpg"
        sceneName = sceneName.replace(/[\/:]/g, "_")
        fs.writeFile(dirName + sceneName, new Buffer(data), (e) => {
          if (e) {
            toastr.error(e.message)
            logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+sceneName+"存储失败:"+e.message+"\r\n"
          }else{
            logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+sceneName+"存储成功\r\n"
          }
        })
      } else {
        logStr +=moment().format("YYYY-MM-DD HH:mm:ss")+"------"+log.Id + "_" + log.Channel_name + "_" + now +"无场景图\r\n"

        
      }

    }
    yield put(actions.log['success']({ savedNumber: ++savedNumber }))
  } catch (e) {
    toastr.error(e.message)
    yield put(actions.log['success']({ loading: false, error: e.message }))
    yield put(actions.export_log['failure']())
  }

}