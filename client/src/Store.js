import isEqual from "react-fast-compare";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { applyMiddleware, compose, createStore } from "redux";
import { persistCombineReducers, persistStore } from "redux-persist";
import createSagaMiddleware from "redux-saga";
import mySaga from "./Sagas";
import { DEFAULT_THEME, Theme } from "./screens/Theme";
type Movement = {
  action: string,
  locationX: number,
  locationY: number,
  timestamp: number,
};
type Device = {
  loginToken: string,
  logged: boolean,
  theme: Theme,
  foregrounded: number,
  menuShown: Boolean,
  movements: Movement[],
  menu: { left: number[], right: number[] },
  map: { zoom: number },
  showNotificatonsHeader: boolean,
  guyVisible: boolean,
  introLevel: number,
  guyText: string,
  hasSeenInfo: {
    [key: string]: boolean,
  },
  hideMap: boolean,
};

const initDevice = {
  loginToken: "",
  logged: true,
  theme: DEFAULT_THEME,
  isConnected: 2,
  menuShown: true,
  foregrounded: 0,
  movements: [],
  menu: {
    left: [0, 1, 2, 3, 4, 5, 6],
    right: [0, 1, 2, 3, 4, 5, 6],
  },
  map: {
    zoom: 3,
  },
  showNotificatonsHeader: false,
  guyVisible: true,
  introLevel: 0,
  guyText: null,
  hasSeenInfo: {},
  hideMap: false,
};

const deviceReducer = (state: Device = initDevice, action) => {
  switch (action.type) {
    case "PURGE": {
      return initDevice;
    }

    case "SET_SHOW_NOTIFICATIONS_HEADER": {
      return { ...state, showNotificatonsHeader: action.value };
    }

    case "SET_GUY_VISIBLE": {
      return {
        ...state,
        guyVisible: action.value,
        guyText: action.value === false ? null : state.guyText,
      };
    }

    case "SET_HIDE_MAP": {
      return {
        ...state,
        hideMap: action.value,
      };
    }

    case "UP_INTRO_LEVEL": {
      console.log("up intro level");
      return { ...state, guyVisible: false, introLevel: state.introLevel + 1 };
    }

    case "RESET_INTRO_LEVEL": {
      return { ...state, introLevel: 0 };
    }

    case "SET_GUY_TEXT": {
      return {
        ...state,
        guyText: action.value,
        guyVisible: true,
        hasSeenInfo: action.setHasSeenInfo
          ? { ...state.hasSeenInfo, [action.setHasSeenInfo]: true }
          : state.hasSeenInfo,
      };
    }

    case "RESET_HAS_SEEN_INFO": {
      return { ...state, hasSeenInfo: {} };
    }

    case "MENU_SET_RIGHT_ACTIVE_SECTIONS": {
      return { ...state, menu: { left: state.menu.left, right: action.value } };
    }
    case "MENU_SET_LEFT_ACTIVE_SECTIONS": {
      return {
        ...state,
        menu: { right: state.menu.right, left: action.value },
      };
    }

    case "SET_IS_CONNECTED": {
      return { ...state, isConnected: action.value };
    }

    case "SET_ZOOM": {
      return { ...state, map: { ...state.map, zoom: action.value } };
    }

    case "SET_MENU_SHOWN": {
      return { ...state, menuShown: action.value };
    }

    case "SET_LOGIN_TOKEN": {
      return { ...initDevice, loginToken: action.value };
    }

    case "SET_LOGIN_TOKEN_AND_LOGIN": {
      return { ...initDevice, loginToken: action.value, logged: true };
    }

    case "SET_LOGGED": {
      return { ...state, logged: action.value };
    }

    case "SET_THEME": {
      return { ...state, theme: action.value };
    }

    case "ADD_MOVEMENT": {
      return { ...state, movements: state.movements.concat([action.value]) };
    }

    case "CLEAR_MOVEMENTS": {
      return { ...state, movements: [] };
    }

    case "INCREASE_FOREGROUNDED": {
      return { ...state, foregrounded: state.foregrounded + 1 };
    }

    default:
      return state;
  }
};

const initMe = null;
const meReducer = (state = initMe, action) => {
  switch (action.type) {
    case "PURGE": {
      return initMe;
    }

    case "ME_FETCH_SUCCEEDED": {
      // NB: I think this would help if sometimes me doesn't change. Keep the same object and prevent rerenders. but unfortunately, me is different every time because of onlineAt/updatedAt. This makes every screen rerender every 5 seconds by default.
      return isEqual(state, action.me) ? state : action.me;
    }

    case "ME_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const initStreetraces = null;
const streetracesReducer = (state = initStreetraces, action) => {
  switch (action.type) {
    case "PURGE": {
      return initStreetraces;
    }

    case "STREETRACES_FETCH_SUCCEEDED": {
      return action.streetraces;
    }

    case "STREETRACES_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const initRobberies = null;
const robberiesReducer = (state = initRobberies, action) => {
  switch (action.type) {
    case "PURGE": {
      return initRobberies;
    }

    case "ROBBERIES_FETCH_SUCCEEDED": {
      return action.robberies;
    }

    case "ROBBERIES_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const initOcs = null;
const ocsReducer = (state = initOcs, action) => {
  switch (action.type) {
    case "PURGE": {
      return initOcs;
    }

    case "OCS_FETCH_SUCCEEDED": {
      return action.ocs;
    }

    case "OCS_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const initCities = null;
const citiesReducer = (state = initCities, action) => {
  switch (action.type) {
    case "PURGE": {
      return initCities;
    }
    case "CITIES_FETCH_SUCCEEDED": {
      return action.cities;
    }
    case "CITIES_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const initAreas = [];
const areasReducer = (state = initAreas, action) => {
  switch (action.type) {
    case "PURGE": {
      return initAreas;
    }
    case "AREAS_FETCH_SUCCEEDED": {
      return action.areas;
    }
    case "AREAS_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const initChannels = [];
const channelsReducer = (state = initChannels, action) => {
  switch (action.type) {
    case "PURGE": {
      return initChannels;
    }
    case "CHANNELS_FETCH_SUCCEEDED": {
      return action.channels;
    }
    case "CHANNELS_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const config = {
  key: "v1",
  storage: AsyncStorage,
  whitelist: [
    "device",
    "me",
    "streetraces",
    "cities",
    "ocs",
    "robberies",
    "areas",
    "channels",
  ],
};

const sagaMiddleware = createSagaMiddleware();

const reducers = {
  device: deviceReducer,
  me: meReducer,
  cities: citiesReducer,
  streetraces: streetracesReducer,
  ocs: ocsReducer,
  robberies: robberiesReducer,
  areas: areasReducer,
  channels: channelsReducer,
};

const rootReducer = persistCombineReducers(config, reducers);

const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

const store = createStore(
  rootReducer,
  composeEnhancers(applyMiddleware(sagaMiddleware))
);
const persistor = persistStore(store);

sagaMiddleware.run(mySaga);

export { persistor, store };
