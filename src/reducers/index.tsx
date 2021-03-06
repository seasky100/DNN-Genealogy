// src/reducers/index.tsx

import { AllActions } from '../actions';
import { StoreState } from '../types';
import { SELECT_DATABASE, SELECT_APP, SELECT_ARC, SELECT_TRAIN, SELECT_NN, SELECT_NNMOTION} from '../constants';

export function reducer(state: StoreState, action: AllActions): StoreState {
  switch (action.type) {
    // case INCREMENT_ENTHUSIASM:
    
    //   return { ...state, enthusiasmLevel:state.enthusiasmLevel+1 };
    // case DECREMENT_ENTHUSIASM:
    //   return { ...state, enthusiasmLevel:state.enthusiasmLevel-1 };
    case SELECT_DATABASE:
      return { ...state, database:action.db}
    case SELECT_APP:  
      return { ...state, app:action.node}
    case SELECT_ARC:  
      return { ...state, arc:action.node}
    case SELECT_TRAIN:  
      return { ...state, train:action.node}
    case SELECT_NN:
      return { ...state, currentNNs:action.currenNNs, selectedNN:action.selectedNN, op:0}
    case SELECT_NNMOTION:
      return { ...state, op:action.op}
    default:
      return state;
  }
}