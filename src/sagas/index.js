import { all,fork } from 'redux-saga/effects'
import * as layout from './layout'
import * as log from './log'
import * as feature from './feature'
import * as upload from './upload'

var allSagas = {
  ...layout,
  ...feature,
  ...log,
  ...upload,
}
 var arrFunc = []
for (var k in allSagas) {
  arrFunc.push(fork(allSagas[k]))
}
export default function* root() {
  yield all(arrFunc)
}