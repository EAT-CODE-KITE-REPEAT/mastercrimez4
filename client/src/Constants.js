const serverAddr = "https://mcz.leckrapi.xyz";
const localAddr = "http://192.168.178.80:4001"; //192.168.1.38
const devLocal = true;

const Constants = {
  SERVER_ADDR: __DEV__ && devLocal ? localAddr : serverAddr,
  CAPTCHA: "6Lcc6egUAAAAABDsc8m8s3m-sxfWAdPR5iV13-Tf",
  IOS_APP_URL:
    "https://apps.apple.com/us/app/mastercrimez/id1527333711?uo=4&at=11l6hc&app=itunes&ct=fnd", //https://apps.apple.com/us/app/mastercrimez/id1527333711?app=itunes
  ANDROID_APP_URL:
    "https://play.google.com/store/apps/details?id=com.wwoessi.mastercrimez&gl=NL",
};

export default Constants;
