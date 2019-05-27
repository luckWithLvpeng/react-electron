import React from 'react';
import ReactDOM from 'react-dom';
import 'sanitize.css';
import "toastr/build/toastr.css"
import "daterangepicker/daterangepicker.css"
import 'bootstrap/dist/css/bootstrap.css'
import './index.css';
import "./i18n"

import * as serviceWorker from './serviceWorker';
import App from './App';

ReactDOM.render(<App/>, document.getElementById('root'));

serviceWorker.unregister();



