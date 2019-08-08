import {put, takeLatest} from 'redux-saga/effects'
import * as actions from '../actions'
import axios from "axios/index";
import {config} from '../service/http'
import toastr from 'toastr'
const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
var store = new Store({name: "userData"})

export function* testServer(action) {
  yield takeLatest(actions.SERVER["REQUEST"], function* (action) {
    try {
      const res = yield axios.get("http://" + action.ip + ":" + action.port + config.api.getEngineLoaded, {params: {}})
      if (res.status) {
        delete action.type
        store.set('IPAndPort', JSON.stringify(action));
        yield put(actions.server['success']({test: true}))
        yield put(actions.channel["request"]())
        yield put(actions.sublib["request"]())
      } else {
        yield put(actions.server['success']({test: false}))
      }
    } catch (e) {
      toastr.error(e.message);
    }
  })
}

