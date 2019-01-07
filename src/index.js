import React from 'react';
import ReactDOM from 'react-dom';
import 'sanitize.css';
import "toastr/build/toastr.css"
import "daterangepicker/daterangepicker.css"
import 'bootstrap/dist/css/bootstrap.css'
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

ReactDOM.render(<App />, document.getElementById('root'));




serviceWorker.unregister();


