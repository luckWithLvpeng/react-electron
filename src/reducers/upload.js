import * as actions from '../actions'

const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
var store = new Store({name: "userData"})
var fileFolder = store.get('fileFolder_upload');
var failureFileFolder = store.get('fileFolder_upload_failure');
var store = null;
if(fileFolder && fileFolder.length >0) {
  store = new Store({name: fileFolder.replace(/\//g,"_")})
  if (!(store.has("failureNum"))) {
    store.set("failureNum",1)
  }
}
var fNum = store && store.get("failureNum",1)
export default {
  UPLOAD(state = {
    path: fileFolder || "",
    faildPath: failureFileFolder || "",
    sublibId: "",
    allNumber: 0,
    acquiredNumber: 0,
    savedNumber: store? store.size - fNum: 0,
    failureNumber: store? store.get("failureNum") - 1: 0,
    traversing: false,
    loading: false,
  }, action) {
    switch (action.type) {
      case actions.UPLOAD["SUCCESS"]:
        delete action.type
        return {...state, ...action};
      case actions.UPLOAD["FAILURE"]:
        if (action.clear) {
          store = new Store({name: state.path.replace(/\//g,"_")})
          store.clear()
          if (!store.has("failureNum")) {
            store.set("failureNum",1)
          }
        }
        return {...state,savedNumber: 0,allNumber:0,failureNumber: 0};
      default:
        return state
    }
  },

}