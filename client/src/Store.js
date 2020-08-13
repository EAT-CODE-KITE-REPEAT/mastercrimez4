import { AsyncStorage } from "react-native";
import { applyMiddleware, compose, createStore } from "redux";
import { persistCombineReducers, persistStore } from "redux-persist";
import createSagaMiddleware from "redux-saga";
import mySaga from "./Sagas";
import { DEFAULT_THEME, Theme } from "./screens/Theme";

type Device = {
  loginToken: string,
  logged: boolean,
  theme: Theme,
};

const initDevice = {
  loginToken: "",
  logged: false,
  theme: DEFAULT_THEME,
};

const deviceReducer = (state: Device = initDevice, action) => {
  switch (action.type) {
    case "SET_LOGIN_TOKEN": {
      return { ...initDevice, loginToken: action.value };
    }

    case "SET_LOGGED": {
      return { ...state, logged: action.value };
    }

    case "SET_THEME": {
      return { ...state, theme: action.value };
    }

    default:
      return state;
  }
};

const initMe = null;
const meReducer = (state = initMe, action) => {
  switch (action.type) {
    case "ME_FETCH_SUCCEEDED": {
      return action.me;
    }

    case "ME_FETCH_FAILED": {
      return state;
    }
    default:
      return state;
  }
};

const config = {
  key: "v1",
  storage: AsyncStorage,
  whitelist: ["device", "me"],
};

const sagaMiddleware = createSagaMiddleware();

const reducers = {
  device: deviceReducer,
  me: meReducer,
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
