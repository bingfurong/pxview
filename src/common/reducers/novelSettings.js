import { NOVEL_SETTINGS } from '../constants/actionTypes';

const initState = {
  fontSize: 14,
  lineHeight: 1,
};

export default function novelSettings(state = initState, action) {
  switch (action.type) {
    case NOVEL_SETTINGS.SET:
      console.log('aaa ', action.payload, state);
      return {
        ...state,
        fontSize:
          action.payload.fontSize !== undefined
            ? action.payload.fontSize
            : state.fontSize,
        lineHeight:
          action.payload.lineHeight !== undefined
            ? action.payload.lineHeight
            : state.lineHeight,
      };
    default:
      return state;
  }
}
