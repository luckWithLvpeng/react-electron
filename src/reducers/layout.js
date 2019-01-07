import * as actions from '../actions'

const electron = window.require('electron');
const Store = electron.remote.require('electron-store');
var store = new Store({name: "userData"})
var IPAndPort = store.get('IPAndPort');
if (IPAndPort) {
  IPAndPort = JSON.parse(IPAndPort)
}
export default {
  SERVER(state = {ip: "", port: "", ...IPAndPort, test: false,}, action) {
    switch (action.type) {
      case actions.SERVER["SUCCESS"]:
        delete action.type
        return {...state, ...action};
      case actions.SERVER["FAILURE"]:
        return {ip: "", port: ""};
      default:
        return state
    }
  }
}