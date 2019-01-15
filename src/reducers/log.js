import * as actions from '../actions'
import moment from "moment/moment"
const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
var store = new Store({name: "userData"})
var fileFolder = store.get('fileFolder',"");
export default {
  LOG(state = {
    path: fileFolder || "",
    begin: moment().startOf('day').unix(),
    end: moment().endOf('day').unix(),
    max: "",
    logmode: "1",
    hit_count: "",
    score_s: 0,
    score_b: 1000,
    sort: "-Verify_time",
    name: "",
    sublib_id: "",
    channel_id: "",
    allNumber: 0,
    acquiredNumber: 0,
    savedNumber: 0,
    error: "",
    loading: false
  }, action) {
    switch (action.type) {
      case actions.LOG["SUCCESS"]:
        delete action.type
        return {...state, ...action};
      case actions.LOG["FAILURE"]:
        return state;
      default:
        return state
    }
  },
  CHANNEL(state = [], action) {
    switch (action.type) {
      case actions.CHANNEL["SUCCESS"]:
        return action.channels || [];
      case actions.CHANNEL["FAILURE"]:
        return [];
      default:
        return state
    }
  },
  SUBLIB(state = [], action) {
    switch (action.type) {
      case actions.SUBLIB["SUCCESS"]:
        return action.sublibs || [];
      case actions.SUBLIB["FAILURE"]:
        return [];
      default:
        return state
    }
  },

}