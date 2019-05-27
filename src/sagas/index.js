import {all, fork} from 'redux-saga/effects'
import * as layout from './layout'
import * as log from './log'
import * as feature from './feature'
import * as upload from './upload'
import * as requestfeature from './requestfeature'


var allSagas = {
    ...layout,
    ...feature,
    ...log,
    ...upload,
    ...requestfeature,
}
var arrFunc = []
for (var k in allSagas) {
    arrFunc.push(fork(allSagas[k]))
}
export default function* root() {
    yield all(arrFunc)
}