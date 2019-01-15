import * as actions from '../actions'

const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
var userData = new Store({name: "userData"})
var fileFolder = userData.get('fileFolder_upload');
var failureFileFolder = userData.get('fileFolder_upload_failure');
var store = null;
if(fileFolder && fileFolder.length >0) {
  store = new Store({name: fileFolder.replace(/[\\/:]/g,"_")})
}
export default {
  UPLOAD(state = {
    path: fileFolder || "",
    faildPath: failureFileFolder || "",
    sublibId: "",
    allNumber: 0,
    acquiredNumber: 0,
    savedNumber: store? store.get("savedNumber") || 0: 0,
    failureNumber: store? store.get("failureNumber") || 0: 0,
    traversing: false,
    loading: false,
    errorText:""
  }, action) {
    switch (action.type) {
      case actions.UPLOAD["SUCCESS"]:
        delete action.type
        return {...state, ...action};
      case actions.UPLOAD["FAILURE"]:
        if (action.clear) {
          store = new Store({name: state.path.replace(/[\\/:]/g,"_")})
          store.clear()
        }
        return {...state,savedNumber: 0,allNumber:0,failureNumber: 0};
      default:
        return state
    }
  },

}