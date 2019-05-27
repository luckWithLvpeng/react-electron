import React, {Component,Suspense} from "react";
import {BrowserRouter as Router} from "react-router-dom";
import {Provider} from 'react-redux'
import {applyMiddleware, combineReducers, createStore} from 'redux'
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
// 加载中
const Loader = () => (
    <div className="App">
        <div>loading...</div>
    </div>
);


export default () => {
    return (
        <Provider store={store}>
            <Router>
                <Suspense fallback={<Loader/>}>
                    <Layout/>
                </Suspense>
            </Router>
        </Provider>
    )
}
