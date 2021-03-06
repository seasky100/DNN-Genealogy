import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './components/App';
import { createStore } from 'redux';
import { reducer } from './reducers/index';
import { StoreState, NN } from './types/index';
import { Provider } from 'react-redux';
// import registerServiceWorker from './registerServiceWorker';
import './index.css';

import * as textInfo from './assets/textInfo.json'
import * as trainInfo from './assets/train.json'
import * as dnns from './assets/dnns.json'

import {initNN} from './constants/index'

import 'antd/dist/antd.css';

let initState:StoreState = {
  database:'nonsequence', 
  arc:'', app:'', 
  trainInfo: trainInfo,
  textInfo: textInfo, 
  selectedNN: initNN, 
  dnns: dnns,
  currentNNs: [initNN], 
  op: 0
}
const store = createStore<StoreState>(reducer, initState );

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root') as HTMLElement
);
// registerServiceWorker();
