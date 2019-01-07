import * as actions from '../actions'
const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
var store = new Store({name: "userData"})
var fileFolder = store.get('fileFolder_feature',"");
export default {
  FEATURE(state = {
    path: fileFolder || "",
    max: "",
    hit_count: "",
    name: "",
    status: "0",
    sublibId: "",
    allNumber: 0,
    acquiredNumber: 0,
    savedNumber: 0,
    loading: false
  }, action) {
    switch (action.type) {
      case actions.FEATURE["SUCCESS"]:
        delete action.type
        return {...state, ...action};
      case actions.FEATURE["FAILURE"]:
        return state;
      default:
        return state
    }
  },

}