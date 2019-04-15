import React from "react";
import {BrowserRouter as Router} from "react-router-dom";
import {Provider} from 'react-redux'
import {createStore,combineReducers,applyMiddleware} from 'redux'
import Layout from './components/Layout.js'
import reducer from './reducers'
import sagas from './sagas'
import createSagaMiddleware from 'redux-saga'
const sagaMiddleware = createSagaMiddleware()

export const store = createStore(
  combineReducers(reducer),
  applyMiddleware(sagaMiddleware)
)
sagaMiddleware.run(sagas)
export default () => {
  return (
    <Provider store={store}>
      <Router>
        <Layout/>
      </Router>
    </Provider>
  )
}
