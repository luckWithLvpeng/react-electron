import * as actions from '../actions'



export default {
  REQUESTFEATURE(state = {
    loading: false,
    complete:false,
    imgNum:0,
    requestErrNum:0,
    requestOkNum:0,
    errorText:""
  }, action) {
    switch (action.type) {
      case actions.REQUEST_FEATURE["SUCCESS"]:
        delete action.type
        return {...state, ...action};
      case actions.REQUEST_FEATURE["FAILURE"]:
        return {...state, ...{
          loading: false,
          complete:false,
          imgNum:0,
          requestErrNum:0,
          requestOkNum:0,
          errorText:""
        }};
      default:
        return state
    }
  },

}