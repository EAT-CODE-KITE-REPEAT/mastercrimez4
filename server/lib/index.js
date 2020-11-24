const express = require("express");
const server = express();
const body_parser = require("body-parser");

const sgMail = require("@sendgrid/mail");
const fs = require("fs");
const Jimp = require("jimp");
const { Sequelize, Model, DataTypes, Op } = require("sequelize");
const cron = require("node-cron");

const cities = require("../assets/airport.json");
require("dotenv").config();
const rateLimit = require("express-rate-limit");

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

var cors = require("cors");

const twilio = require("twilio");
const {
  getRank,
  publicUserFields,
  getTextFunction,
  sendChatPushMail,
  saveImageIfValid,
} = require("./util");

var accountSid = process.env.TWILIO_SID; // Your Account SID from www.twilio.com/console
var authToken = process.env.TWILIO_AUTH_SECRET; // Your Auth Token from www.twilio.com/console

var twilioClient = new twilio(accountSid, authToken);

let getText = getTextFunction();
const EMAIL_FROM = "noreply@mastercrimez.com";

const allUserFields = publicUserFields.concat([
  "activated",
  "email",
  "bullets",
  "city",
  "backfire",
  "weapon",
  "protection",
  "airplane",
  "home",
  "phoneVerified",
  "pushtoken",
  "credits",
  "attackAt",
  "autostelenAt",
  "crimeAt",
  "reizenAt",
  "jailAt",
  "wietAt",
  "junkiesAt",
  "hoerenAt",
  "gymAt",
  "gymTime",
  "bunkerAt",
  "incomeAt",
  "robAt",
  "ocAt",
  "bombAt",
  "protectionAt",
  "workAt",
  "swissBank",
  "rankKnow",
  "swissBullets",
  "needCaptcha",
  "numActions",
  "locale",
]);

function me(token) {
  return User.findOne({
    attributes: publicUserFields,
    where: { loginToken: token },
  });
}

function earthDistance(lat1, long1, lat2, long2, response) {
  const m = Math.PI / 180;

  lat1 = lat1 * m;
  long1 = long1 * m;
  lat2 = lat2 * m;
  long2 = long2 * m;

  var R = 6371e3; // metres of earth radius

  var x = (long2 - long1) * Math.cos((lat1 + lat2) / 2);
  var y = lat2 - lat1;

  var d = Math.sqrt(x * x + y * y) * R;

  return response === "m" ? Math.round(d / 10) * 10 : Math.round(d / 1000); //in kilometers!
}

const sequelize = new Sequelize({
  dialect: "mysql",
  database: process.env.DB_DB,
  username: process.env.DB_USER,
  password: process.env.DB_PASS,
  dialectOptions: {
    host: process.env.DB_HOST,
    port: "3306",
  },
  logging: null,
});

class User extends Model {}

User.init(
  {
    captcha: DataTypes.INTEGER,
    needCaptcha: DataTypes.BOOLEAN,
    numActions: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    ip: DataTypes.STRING,
    loginToken: {
      type: DataTypes.STRING,
    },
    activationToken: DataTypes.STRING,
    forgotPasswordToken: DataTypes.STRING,
    activated: DataTypes.BOOLEAN,
    level: DataTypes.INTEGER,

    gangLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },

    pushtoken: DataTypes.STRING,

    locale: {
      type: DataTypes.STRING,
      defaultValue: "en",
    },

    receiveMessagesMail: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },

    credits: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    creditsTotal: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rankKnow: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    phone: DataTypes.STRING,
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    phoneVerificationCode: DataTypes.INTEGER,

    email: DataTypes.STRING,
    name: { type: DataTypes.STRING },

    image: DataTypes.STRING,
    thumbnail: DataTypes.STRING,

    bio: DataTypes.TEXT,
    accomplice: DataTypes.STRING,
    accomplice2: DataTypes.STRING,
    accomplice3: DataTypes.STRING,
    accomplice4: DataTypes.STRING,

    onlineAt: DataTypes.BIGINT,
    autostelenAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    gymTime: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    crimeAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    workAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    reizenAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    jailAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    bombAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    wietAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    junkiesAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    hoerenAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    gymAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    bunkerAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    incomeAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    attackAt: {
      type: DataTypes.BIGINT, //wanneer je HEBT aangevallen
      defaultValue: 0,
    },

    attackedAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    robbedAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    robAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    ocAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    protectionAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    home: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    airplane: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    garage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    protection: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    weapon: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    wiet: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    junkies: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    hoeren: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    strength: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    cash: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    gamepoints: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    bank: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    swissBank: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },

    swissBullets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    bullets: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    backfire: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },

    rank: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    health: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },

    city: {
      type: DataTypes.STRING,
      defaultValue: "Amsterdam",
    },

    password: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: "user",
    indexes: [
      { unique: true, fields: ["name"] },
      { unique: true, fields: ["loginToken"] },
    ],
  }
);

class Streetrace extends Model {}

Streetrace.init(
  {
    city: DataTypes.STRING,
    numParticipants: DataTypes.INTEGER,
    type: DataTypes.STRING,
    price: DataTypes.INTEGER,
    creator: DataTypes.STRING,
  },
  { sequelize, modelName: "streetrace" }
);

class StreetraceParticipant extends Model {}

StreetraceParticipant.init(
  {
    streetraceId: DataTypes.INTEGER,
    name: DataTypes.STRING,
    car: DataTypes.STRING,
    image: DataTypes.STRING,
    power: DataTypes.INTEGER,
  },
  { sequelize, modelName: "streetraceParticipant" }
);

class City extends Model {}

City.init(
  {
    city: DataTypes.STRING,
    bullets: DataTypes.INTEGER,
    bulletFactoryOwner: DataTypes.STRING,
    bulletFactoryPrice: {
      type: DataTypes.INTEGER,
      defaultValue: 100,
    },
    bulletFactoryProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    bulletFactoryDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    casinoOwner: DataTypes.STRING,
    casinoProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    casinoDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    rldOwner: DataTypes.STRING,
    rldProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    rldDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    landlordOwner: DataTypes.STRING,
    landlordProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    landlordDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    junkiesOwner: DataTypes.STRING,
    junkiesProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    junkiesDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    weaponShopOwner: DataTypes.STRING,
    weaponShopProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    weaponShopDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    estateAgentOwner: DataTypes.STRING,
    estateAgentProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    estateAgentDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    garageOwner: DataTypes.STRING,
    garageProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    garageDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    airportOwner: DataTypes.STRING,
    airportProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    airportDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    jailOwner: DataTypes.STRING,
    jailProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    jailPutAt: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    jailDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    bankOwner: DataTypes.STRING,
    bankProfit: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    bankDamage: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  { sequelize, modelName: "city" }
);
class Garage extends Model {}

Garage.init(
  {
    userId: DataTypes.INTEGER,
    date: DataTypes.DATE,
    auto: DataTypes.STRING,
    image: DataTypes.STRING,
    cash: DataTypes.INTEGER,
    power: DataTypes.INTEGER,
    kogels: DataTypes.INTEGER,
  },
  { sequelize, modelName: "garage" }
);

class Chat extends Model {}

Chat.init(
  {
    name: DataTypes.STRING,
    message: DataTypes.TEXT,
  },
  { sequelize, modelName: "chat" }
);

class Payment extends Model {}

Payment.init(
  {
    paymentId: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    credits: DataTypes.INTEGER,
    status: DataTypes.STRING,
  },
  { sequelize, modelName: "payment" }
);

class Image extends Model {}

Image.init(
  {
    image: DataTypes.STRING,
    uid: DataTypes.INTEGER,
  },
  { sequelize, modelName: "image" }
);

class Offer extends Model {}

Offer.init(
  {
    //userId
    type: DataTypes.STRING,
    amount: DataTypes.BIGINT,
    price: DataTypes.BIGINT,
    isBuy: DataTypes.BOOLEAN,
  },
  { sequelize, modelName: "offer" }
);

Offer.belongsTo(User, { constraints: false });
User.hasMany(Offer, { constraints: false });

class Channel extends Model {}

Channel.init(
  {
    name: DataTypes.STRING,
    pmUsers: DataTypes.STRING, // format [uid1][uid2]
    gangName: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: "channel",
  }
);

class ChannelSub extends Model {}

ChannelSub.init(
  {
    lastmessageDate: {
      type: DataTypes.BIGINT,
    },
    isDeleted: DataTypes.BOOLEAN,

    unread: { type: DataTypes.INTEGER, defaultValue: 0 },
    lastmessage: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: "channelsub",
  }
);
ChannelSub.belongsTo(Channel);
Channel.hasMany(ChannelSub);

ChannelSub.belongsTo(User, { constraints: false });
User.hasMany(ChannelSub, { constraints: false });

class ChannelMessage extends Model {}

ChannelMessage.init(
  {
    message: DataTypes.TEXT,
    image: DataTypes.STRING,
    isSystem: DataTypes.BOOLEAN,
  },
  {
    sequelize,
    modelName: "channelMessage",
  }
);
ChannelMessage.belongsTo(User, { constraints: false });
User.hasMany(ChannelMessage, { constraints: false });

ChannelMessage.belongsTo(Channel);
Channel.hasMany(ChannelMessage);

class Gang extends Model {}

Gang.init(
  {
    name: DataTypes.STRING,
    members: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    power: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    score: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    bank: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    bullets: {
      type: DataTypes.BIGINT,
      defaultValue: 0,
    },
    profile: DataTypes.TEXT,
    image: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    item1: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item2: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item3: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item4: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item5: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item6: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item7: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item8: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item9: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item10: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item11: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    item12: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: "gang",
  }
);

User.belongsTo(Gang, { constraints: false });
Gang.hasMany(User, { constraints: false });

class GangRequest extends Model {}

GangRequest.init(
  {
    gangName: DataTypes.STRING,
    isInvite: DataTypes.BOOLEAN,
  },
  {
    sequelize,
    modelName: "gangRequest",
  }
);

GangRequest.belongsTo(User, { constraints: false });
User.hasMany(GangRequest, { constraints: false });

class Movement extends Model {}

Movement.init(
  {
    userId: DataTypes.INTEGER,
    action: DataTypes.STRING,
    locationX: DataTypes.FLOAT,
    locationY: DataTypes.FLOAT,
    timestamp: DataTypes.BIGINT,
  },
  { sequelize, modelName: "movement" }
);

class Action extends Model {}

Action.init(
  {
    userId: DataTypes.INTEGER,
    action: DataTypes.STRING,
    timestamp: DataTypes.BIGINT,
  },
  { sequelize, modelName: "action" }
);

class ForumTopic extends Model {}

ForumTopic.init(
  {
    name: DataTypes.STRING,
    title: DataTypes.STRING,
    message: DataTypes.TEXT,
    responses: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  { sequelize, modelName: "forum_topic" }
);

class ForumResponse extends Model {}

ForumResponse.init(
  {
    name: DataTypes.STRING,
    topicId: DataTypes.INTEGER,
    message: DataTypes.TEXT,
  },
  { sequelize, modelName: "forum_response" }
);

StreetraceParticipant.belongsTo(Streetrace, {
  foreignKey: "streetraceId",
});
Streetrace.hasMany(StreetraceParticipant, {
  foreignKey: "streetraceId",
});

try {
  sequelize.sync({ alter: true }); //{alter}:true}
} catch (e) {
  console.log("e", e);
}

server.use(body_parser.json({ limit: "10mb", extended: true }));
server.use(body_parser.urlencoded({ limit: "10mb", extended: true }));

server.use(
  cors({
    origin: "*",
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
  })
);

server.enable("trust proxy");

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, //1minute
  max: 120, // limit each IP to 100 requests per windowMs
});

//  apply to all requests
server.use(limiter);

server.use("/images", express.static("images"));
server.use("/uploads", express.static("uploads"));

/** ENDPOINTS  */

server.post("/upload", async (req, res, next) => {
  const { image, token } = req.body;

  const user = await User.findOne({ where: { loginToken: token } });

  if (!user) {
    res.json({ response: "Verkeerd token" });
    return;
  }

  getText = getTextFunction(user.locale);

  try {
    // to declare some path to store your converted image
    const path = "./uploads/" + Date.now() + ".png";
    // to convert base64 format into random filename
    const base64Data = image.replace(/^data:([A-Za-z-+/]+);base64,/, "");

    fs.writeFileSync(path, base64Data, { encoding: "base64" });

    Jimp.read(path, (err, image) => {
      if (err) throw err;
      image
        .scaleToFit(512, 512) // resize
        .write(path); // save
    });

    Image.create({ image: path, uid: user.id });

    return res.json({ path, response: getText("succeeded") });
  } catch (e) {
    next(e);
  }
});

server.get("/listimages", async (req, res) => {
  const { token, uid } = req.query;

  if (!token) {
    res.json({ response: getText("noToken") });
    return;
  }

  const user = await User.findOne({ where: { loginToken: token } });

  if (!user) {
    res.json({ response: getText("invalidUser") });
    return;
  }

  const images = await Image.findAll({ where: { uid } });

  res.json({
    images: images,
  });
});

server.post("/deleteimage", async (req, res) => {
  const { token, id } = req.body;

  if (!token) {
    res.json({ response: getText("noToken") });
    return;
  }

  const user = await User.findOne({ where: { loginToken: token } });

  if (!user) {
    res.json({ response: getText("invalidUser") });
    return;
  }

  const image = await Image.findOne({ where: { id: id, uid: user.id } });

  if (image) {
    image.destroy();
  }

  res.json({
    reponse: "success",
  });
});

server.get("/garage", (req, res) =>
  require("./garage").garage(req, res, User, Garage)
);

server.get("/racecars", (req, res) =>
  require("./garage").racecars(req, res, User, Garage)
);

server.get("/garageGrouped", (req, res) =>
  require("./garage").garageGrouped(req, res, User, Garage, sequelize)
);

server.post("/sellcar", (req, res) =>
  require("./garage").sellcar(req, res, User, Garage, Action)
);

server.post("/buyBullets", (req, res) =>
  require("./buyBullets").buyBullets(req, res, sequelize, User, City, Action)
);
server.post("/bomb", (req, res) =>
  require("./bomb").bomb(req, res, {
    User,
    City,
    Action,
    Channel,
    ChannelMessage,
    ChannelSub,
  })
);

server.get("/cities", (req, res) => require("./cities").cities(req, res, City));

server.post("/crushcar", (req, res) =>
  require("./garage").crushcar(req, res, User, Garage, Action)
);

server.post("/upgradecar", (req, res) =>
  require("./garage").upgradecar(req, res, User, Garage, Action)
);

server.post("/bulkaction", (req, res) =>
  require("./garage").bulkaction(req, res, User, Garage, Action)
);

server.post("/stealcar", (req, res) =>
  require("./stealcar").stealcar(req, res, User, Garage, Action)
);

server.post("/removeprotection", (req, res) =>
  require("./removeprotection").removeprotection(req, res, User)
);

server.post("/crime", (req, res) =>
  require("./crime").crime(req, res, User, Action)
);

server.post("/work", (req, res) =>
  require("./work").work(req, res, User, Action)
);

server.post("/gym", (req, res) => require("./gym").gym(req, res, User, Action));

server.post("/hoeren", (req, res) =>
  require("./hoeren").hoeren(req, res, User, Action)
);

server.post("/becomeOwner", (req, res) =>
  require("./manageObject").becomeOwner(req, res, User, City)
);
server.post("/giveAway", (req, res) =>
  require("./manageObject").giveAway(req, res, {
    User,
    City,
    Channel,
    ChannelMessage,
    ChannelSub,
  })
);
server.post("/changePrice", (req, res) =>
  require("./manageObject").changePrice(req, res, User, City)
);
server.post("/getProfit", (req, res) =>
  require("./manageObject").getProfit(req, res, sequelize, User, City, Action)
);

server.post("/repairObject", (req, res) =>
  require("./manageObject").repairObject(
    req,
    res,
    sequelize,
    User,
    City,
    Action
  )
);

server.post("/putInJail", (req, res) =>
  require("./manageObject").putInJail(req, res, {
    User,
    City,
    Channel,
    ChannelMessage,
    ChannelSub,
    Action,
  })
);

server.post("/marketCreateOffer", (req, res) =>
  require("./market").marketCreateOffer(req, res, {
    User,
    Offer,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.post("/marketRemoveOffer", (req, res) =>
  require("./market").marketRemoveOffer(req, res, {
    User,
    Offer,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.post("/marketTransaction", (req, res) =>
  require("./market").marketTransaction(req, res, {
    User,
    Offer,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.get("/market", (req, res) =>
  require("./market").market(req, res, {
    User,
    Offer,
  })
);
server.post("/gangCreate", (req, res) =>
  require("./gang").gangCreate(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.post("/gangUpdate", (req, res) =>
  require("./gang").gangUpdate(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    GangRequest,
  })
);

server.post("/gangTransaction", (req, res) =>
  require("./gang").gangTransaction(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.post("/gangSetRank", (req, res) =>
  require("./gang").gangSetRank(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.post("/gangJoin", (req, res) =>
  require("./gang").gangJoin(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    GangRequest,
  })
);

server.post("/gangAnswerInvite", (req, res) =>
  require("./gang").gangAnswerInvite(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    GangRequest,
  })
);

server.post("/gangAnswerJoin", (req, res) =>
  require("./gang").gangAnswerJoin(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    GangRequest,
  })
);

server.post("/gangInvite", (req, res) =>
  require("./gang").gangInvite(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    GangRequest,
  })
);

server.post("/gangShop", (req, res) =>
  require("./gang").gangShop(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.get("/gangAchievements", (req, res) =>
  require("./gang").gangAchievements(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    City,
  })
);

server.get("/gangInvites", (req, res) =>
  require("./gang").gangInvites(req, res, {
    User,
    Gang,
    GangRequest,
  })
);

server.post("/gangKick", (req, res) =>
  require("./gang").gangKick(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    GangRequest,
  })
);

server.post("/gangLeave", (req, res) =>
  require("./gang").gangLeave(req, res, {
    Gang,
    User,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
  })
);

server.post("/gangRemove", (req, res) =>
  require("./gang").gangRemove(req, res, {
    User,
    Gang,
    Action,
    Channel,
    ChannelSub,
    ChannelMessage,
    GangRequest,
  })
);

server.get("/gangs", (req, res) =>
  require("./gang").gangs(req, res, {
    User,
    Gang,
  })
);

server.get("/gang", (req, res) =>
  require("./gang").gang(req, res, {
    User,
    Gang,
  })
);

server.post("/wiet", (req, res) =>
  require("./wiet").wiet(req, res, User, Action)
);

server.post("/junkies", (req, res) =>
  require("./junkies").junkies(req, res, User, Action)
);

// server.get("/showroom", (req, res) =>
//   require("./showroom").showroom(req, res, User, Garage)
// );

// server.post("/buycar", (req, res) =>
//   require("./showroom").buycar(req, res, User, Garage)
// );

server.post("/donate", (req, res) =>
  require("./donate").donate(req, res, {
    User,
    Channel,
    ChannelMessage,
    ChannelSub,
    Action,
  })
);

server.post("/bunker", (req, res) =>
  require("./bunker").bunker(req, res, User, Action)
);

server.get("/creditshop", (req, res) =>
  require("./creditshop").creditshop(req, res, User)
);

server.post("/creditshopBuy", (req, res) =>
  require("./creditshop").creditshopBuy(req, res, User)
);

server.get("/jail", (req, res) => require("./jail").jail(req, res, User));
server.post("/breakout", (req, res) =>
  require("./jail").breakout(req, res, {
    User,
    Channel,
    ChannelMessage,
    ChannelSub,
    Action,
  })
);

server.post("/buyout", (req, res) =>
  require("./jail").buyout(req, res, User, Message, City, Action)
);

server.post("/poker", (req, res) =>
  require("./poker").poker(req, res, User, City, Action)
);

server.post("/bank", (req, res) =>
  require("./bank").bank(req, res, User, Action)
);

server.post("/swissBank", (req, res) =>
  require("./swissBank").swissBank(req, res, User, Action)
);

server.post("/airport", (req, res) =>
  require("./airport").airport(req, res, User, Action)
);

server.post("/movementsApp", (req, res) =>
  require("./movements").movementsApp(req, res, User, Movement)
);

server.post("/createStreetrace", (req, res) =>
  require("./streetrace").createStreetrace(
    req,
    res,
    User,
    Streetrace,
    StreetraceParticipant,
    Garage,
    Action
  )
);

server.get("/streetraces", (req, res) =>
  require("./streetrace").streetraces(
    req,
    res,
    User,
    Streetrace,
    StreetraceParticipant,
    Garage
  )
);

server.post("/joinStreetrace", (req, res) =>
  require("./streetrace").joinStreetrace(
    req,
    res,
    User,
    Streetrace,
    StreetraceParticipant,
    Garage,
    Action
  )
);

server.post("/leaveStreetrace", (req, res) =>
  require("./streetrace").leaveStreetrace(
    req,
    res,
    User,
    Streetrace,
    StreetraceParticipant,
    Garage,
    Action
  )
);

server.post("/startStreetrace", (req, res) =>
  require("./streetrace").startStreetrace(req, res, {
    User,
    Streetrace,
    StreetraceParticipant,
    Channel,
    ChannelMessage,
    ChannelSub,
    Action,
  })
);

server.post("/income", (req, res) =>
  require("./income").income(req, res, sequelize, User, City, Action)
);

server.post("/rob", (req, res) =>
  require("./rob").rob(req, res, {
    User,
    Action,
    Channel,
    ChannelMessage,
    ChannelSub,
  })
);

server.post("/hospital", (req, res) =>
  require("./hospital").hospital(req, res, {
    User,
    Channel,
    ChannelMessage,
    ChannelSub,
    Action,
  })
);

server.post("/kill", (req, res) =>
  require("./kill").kill(req, res, {
    User,
    Channel,
    ChannelMessage,
    ChannelSub,
    City,
    Action,
  })
);

server.post("/oc", (req, res) => require("./oc").oc(req, res, User, Action));

server.post("/getalive", (req, res) =>
  require("./kill").getalive(req, res, User, Garage, Action)
);

server.post("/admin/email", (req, res) =>
  require("./admin_email").email(req, res, User)
);

server.get("/admin/ips", (req, res) =>
  require("./admin_ips").ips(req, res, User, sequelize)
);

server.get("/admin/actions", (req, res) =>
  require("./admin_actions").actions(req, res, User, sequelize)
);

//forum
server.post("/topic", (req, res) =>
  require("./forum").newTopic(req, res, User, ForumTopic)
);
server.post("/response", (req, res) =>
  require("./forum").response(req, res, {
    ForumTopic,
    ForumResponse,
    Channel,
    ChannelMessage,
    ChannelSub,
    User,
  })
);
server.get("/topics", (req, res) =>
  require("./forum").topics(req, res, User, ForumTopic, ForumResponse)
);
server.get("/topic", (req, res) =>
  require("./forum").getTopic(req, res, User, ForumTopic, ForumResponse)
);

server.post("/setAccomplice", (req, res) =>
  require("./accomplice").setAccomplice(req, res, User)
);

server.post("/mollieCreate", (req, res) =>
  require("./mollieCreate").mollieCreate(req, res, User, Payment)
);
server.post("/mollieWebhook", (req, res) =>
  require("./mollieWebhook").mollieWebhook(req, res, User, Payment)
);
server.get("/shop", (req, res) => require("./shop").shop(req, res, User));

server.post("/superMessage", (req, res) =>
  require("./superMessage").superMessage(req, res, {
    User,
    Channel,
    ChannelMessage,
    ChannelSub,
  })
);

server.post("/buy", (req, res) => require("./shop").buy(req, res, User, City));

server.get("/chat", (req, res) => {
  Chat.findAll({ order: [["id", "DESC"]], limit: 10 }).then((chat) => {
    res.json(chat);
  });
});

server.get("/channelsubs", (req, res) =>
  require("./channelsubs").channelsubs(req, res, User, ChannelSub, Channel)
);

server.get("/pm", (req, res) =>
  require("./channelsubs").pm(req, res, User, ChannelSub, Channel)
);
server.post("/setRead", (req, res) =>
  require("./channelsubs").setRead(req, res, User, ChannelSub, Channel)
);
server.post("/setDeleted", (req, res) =>
  require("./channelsubs").setDeleted(req, res, User, ChannelSub, Channel)
);
server.post("/deleteAll", (req, res) =>
  require("./channelsubs").deleteAll(req, res, User, ChannelSub, Channel)
);

server
  .get("/channelmessage", (req, res) =>
    require("./channelmessage").getChat(req, res, {
      User,
      ChannelMessage,
      ChannelSub,
    })
  )
  .post("/channelmessage", (req, res) =>
    require("./channelmessage").postChat(req, res, {
      User,
      Channel,
      ChannelMessage,
      ChannelSub,
      sequelize,
    })
  );

server.post("/chat", async (req, res) => {
  const { message, token } = req.body;

  const user = await User.findOne({ where: { loginToken: token } });

  if (user && message) {
    Chat.create({ name: user.name, message }).then((chat) => {
      res.json(chat);
    });
  } else {
    res.json({ response: getText("invalidUser") });
  }
});

server.get("/profile", (req, res) => {
  User.findOne({
    attributes: publicUserFields,
    include: { model: Gang, attributes: ["id", "name", "image", "thumbnail"] },
    where: {
      $and: Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("user.name")),
        Sequelize.fn("lower", req.query.name)
      ),
    },
  }).then(async (user) => {
    if (user) {
      const accomplices = await User.findAll({
        attributes: ["name", "rank"],
        where: Sequelize.or(
          { accomplice: user.name },
          { accomplice2: user.name },
          { accomplice3: user.name },
          { accomplice4: user.name }
        ),
      });

      let extended = user;
      extended.dataValues.accomplices = accomplices;

      res.json(extended);
    } else {
      res.json(null);
    }
  });
});

server.get("/members", (req, res) => {
  //return coordinatesets that are located in a square of lat/lng

  const { order } = req.query;
  const validOrders = [
    "onlineAt",
    "bank",
    "cash",
    "name",
    "hoeren",
    "junkies",
    "wiet",
    "rank",
    "strength",
  ];
  const validOrder = validOrders.includes(order) ? order : validOrders[0];

  User.findAll({
    attributes: publicUserFields,
    order: [[validOrder, "DESC"]],
    include: { model: Gang, attributes: ["id", "name", "thumbnail"] },
    limit: 100,
    where: { health: { [Op.gt]: 0 } },
  }).then((user) => {
    res.json(user);
  });
});

server.get("/stats", async (req, res) => {
  //return coordinatesets that are located in a square of lat/lng

  const stats = [
    "createdAt",
    "bank",
    "hoeren",
    "junkies",
    "wiet",
    "rank",
    "strength",
    "gamepoints",
  ];

  const allStats = await Promise.all(
    stats.map(async (stat) => ({
      [stat]: await User.findAll({
        attributes: publicUserFields,
        include: { model: Gang, attributes: ["id", "name", "thumbnail"] },
        order: [[stat, "DESC"]],
        limit: 10,
        where: { health: { [Op.gt]: 0 } },
      }),
    }))
  );

  const newMembers = await User.findAll({
    attributes: ["name"],
    where: {
      phoneVerified: true,
      createdAt: { [Op.gt]: Date.now() - 86400000 },
    },
  });

  const onlineToday = await User.count({
    where: {
      phoneVerified: true,
      onlineAt: { [Op.gt]: Date.now() - 86400000 },
    },
  });

  allStats.push({
    newMembers: newMembers.map((x) => x.dataValues.name).join(", "),
  });
  allStats.push({ onlineToday });

  res.json(allStats);
});

server.get("/me", (req, res) => {
  if (!req.query.token) {
    /* ||
    !isNaN(Number(req.query.token)) ||
    req.query.token.length < 64*/

    return res.json({ success: false, response: getText("noToken") });
  }

  User.findOne({
    attributes: allUserFields,
    where: { loginToken: String(req.query.token) },
    include: { model: Gang },
  })
    .then(async (user) => {
      if (user) {
        const jail = await User.findAll({
          attributes: ["id"],
          where: { jailAt: { [Op.gt]: Date.now() } },
        });

        const online = await User.findAll({
          attributes: ["id"],
          where: { onlineAt: { [Op.gt]: Date.now() - 300000 } },
        });

        const [[position]] = await sequelize.query(
          `SELECT COUNT(id) AS amount FROM users WHERE rank > ${user.rank}`
        );

        const [[chats]] = await sequelize.query(
          `SELECT SUM(unread) AS unread FROM channelsubs WHERE userId=${user.id};`
        );

        const accomplices = await User.findAll({
          attributes: ["name", "rank"],
          where: Sequelize.or(
            { accomplice: user.name },
            { accomplice2: user.name },
            { accomplice3: user.name },
            { accomplice4: user.name }
          ),
        });

        const userWithMessages = user.dataValues;
        userWithMessages.accomplices = accomplices;
        userWithMessages.position = position.amount + 1;
        userWithMessages.chats = chats.unread || 0;
        userWithMessages.jail = jail.length;
        userWithMessages.online = online.length;

        const rankNow = getRank(user.rank, "number");
        if (rankNow > user.rankKnow) {
          sendChatPushMail({
            Channel,
            ChannelMessage,
            ChannelSub,
            User,
            isSystem: true,
            message: getText(
              "yourRankIncreasedTo",
              getRank(user.rank, "rankname")
            ),
            user1: undefined,
            user2: user,
          });

          User.update({ rankKnow: rankNow }, { where: { id: user.id } });
        }

        res.json(userWithMessages);

        User.update(
          { onlineAt: Date.now(), ip: req.ip },
          { where: { loginToken: req.query.token } }
        );
      } else {
        const name = await getAvailableName();
        const user = await User.create({
          loginToken: String(req.query.token),
          name,
        });

        const newuser = await User.findOne({
          attributes: allUserFields,
          where: { loginToken: String(req.query.token) },
          include: { model: Gang },
        });

        const jail = await User.findAll({
          attributes: ["id"],
          where: { jailAt: { [Op.gt]: Date.now() } },
        });

        const online = await User.findAll({
          attributes: ["id"],
          where: { onlineAt: { [Op.gt]: Date.now() - 300000 } },
        });

        const [[position]] = await sequelize.query(
          `SELECT COUNT(id) AS amount FROM users WHERE rank > ${newuser.rank}`
        );

        const [[chats]] = await sequelize.query(
          `SELECT SUM(unread) AS unread FROM channelsubs WHERE userId=${newuser.id};`
        );

        const accomplices = await User.findAll({
          attributes: ["name", "rank"],
          where: Sequelize.or(
            { accomplice: newuser.name },
            { accomplice2: newuser.name },
            { accomplice3: newuser.name },
            { accomplice4: newuser.name }
          ),
        });

        const userWithMessages = newuser.dataValues;
        userWithMessages.jail = jail.length;
        userWithMessages.online = online.length;
        userWithMessages.accomplices = accomplices;
        userWithMessages.position = position.amount + 1;
        userWithMessages.chats = chats.unread || 0;

        res.json(userWithMessages);
      }
    })
    .catch((e) => console.log(e));
});

server.post("/forgotPassword", async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });

  if (user) {
    const forgotPasswordToken = Math.round(Math.random() * 999999999);

    getText = getTextFunction(user.locale);

    const msg = {
      to: email,
      from: EMAIL_FROM,
      subject: getText("resetPasswordTitle"),
      text: getText("resetPasswordText", forgotPasswordToken),
    };

    User.update({ forgotPasswordToken }, { where: { email: user.email } });

    //ES6
    sgMail.send(msg).then(() => {
      res.json({ success: getText("resetPasswordSuccess") });
    }, console.error);
  } else {
    res.json({ error: getText("resetPasswordEmailNotFound") });
  }
});

server.post("/updateToken", async (req, res) => {
  const { loginToken, newLoginToken } = req.body;

  if (!loginToken) {
    return res.json({ response: getText("noToken") });
  }

  const user = await User.findOne({ where: { loginToken } });

  if (!user) {
    return res.json({ response: getText("invalidUser") });
  }

  getText = getTextFunction(user.locale);

  if (!newLoginToken) {
    return res.json({ response: getText("noNewLoginToken") });
  }

  if (newLoginToken.length < 15) {
    return res.json({ response: getText("tokenTooShort") });
  }

  const already = await User.findOne({ where: { loginToken: newLoginToken } });
  if (already) {
    return res.json({ response: getText("already") });
  }

  User.update({ loginToken: String(newLoginToken) }, { where: { loginToken } });

  console.log({
    response: getText("success"),
    success: true,
    token: newLoginToken,
  });
  return res.json({ response: getText("success"), success: true });
});

server.post("/forgotPassword2", async (req, res) => {
  const { token, password } = req.body;

  const updated = await User.update(
    { password },
    { where: { forgotPasswordToken: token } }
  );

  if (updated[0] === 1) {
    res.json({ success: getText("forgotPasswordSuccess") });
  } else {
    res.json({ error: getText("forgotPasswordError") });
  }
});

function isEmail(email) {
  var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

function randomEntry(array) {
  return array[Math.floor(array.length * Math.random())];
}

const getAvailableName = async (locale) => {
  const names = [
    "dork",
    "criminal",
    "dude",
    "guest",
    "gangster",
    "buddy",
    "pimp",
    "meany",
    "crazy",
  ];
  const name = randomEntry(names);
  const number = Math.round(Math.random() * 1000);

  const fullname = name + number;

  const already = await User.findOne({ where: { name: fullname } });

  if (already) {
    return getAvailableName(locale);
  }
  return fullname;
};

server.post("/signupEmail", async (req, res) => {
  const { email, loginToken } = req.body;
  console.log("SIGNUPEMAIL");

  if (!loginToken || !email) {
    res.json({ error: getText("invalidInput") });
    return;
  }

  const emailAlready = await User.findOne({
    where: { email, loginToken: { [Op.ne]: loginToken } },
  });

  const user = await User.findOne({ where: { loginToken } });

  if (!user) {
    res.json({ error: getText("invalidUser") });
    return;
  }

  getText = getTextFunction(user.locale);

  if (emailAlready) {
    res.json({ error: getText("signupEmailAlreadyInUse") });
  } else if (!isEmail(email)) {
    res.json({ error: getText("signupEmailNotValid") });
  } else {
    const activationToken = Math.round(Math.random() * 999999999);

    User.update(
      { email, activationToken, activated: false },
      { where: { loginToken } }
    );
    const msg = {
      to: email,
      from: EMAIL_FROM,
      subject: getText("signupEmailConfirmTitle"),
      html: getText("signupEmailHtml", activationToken),
    };

    //ES6
    sgMail
      .send(msg)
      .then((response) => {
        res.json({ success: getText("signupEmailSuccess") });
      }, console.error)
      .catch((e) => console.log(e));
  }
});

/**
 *  just activates an account if activationtoken given is correct
 */
server.post("/activate", async (req, res) => {
  const { activationToken } = req.body;

  if (activationToken) {
    const user = await User.update(
      { activated: true },
      { where: { activationToken, activated: false } }
    );

    if (user[0] === 1) {
      res.json({ response: getText("success") });
    } else {
      res.json({ response: getText("invalidLink") });
    }
  }
});

server.post("/updateProfile", async (req, res) => {
  const { loginToken, image, backfire, bio, pushtoken, locale } = req.body;

  if (!loginToken) {
    res.json({ response: getText("noToken") });
    return;
  }

  const user = await User.findOne({ where: { loginToken } });

  if (!user) {
    res.json({ response: getText("invalidUser") });
    return;
  }

  let update = {};

  if (locale) {
    update.locale = locale;
  }

  if (image && image.includes("data:image")) {
    //image change
    const { pathImage, pathThumbnail } = saveImageIfValid(res, image, true);

    console.log("image updaten");
    if (pathImage && pathThumbnail) {
      update.image = pathImage;
      update.thumbnail = pathThumbnail;
    }
  }

  if (bio) {
    update.bio = bio;
  }

  if (pushtoken !== undefined) {
    update.pushtoken = pushtoken;
  }

  if (backfire !== undefined && backfire >= 0 && backfire <= 1) {
    update.backfire = backfire;
  }

  if (loginToken) {
    const user = await User.update(update, { where: { loginToken } });
    res.json({ user });
  }
});

server.post("/setPhone", async (req, res) => {
  const { phone, token } = req.body;

  if (!token) {
    res.json({ response: getText("noToken") });
    return;
  }

  const user = await User.findOne({ where: { loginToken: token } });

  if (!user) {
    res.json({ response: getText("invalidUser") });
    return;
  }

  getText = getTextFunction(user.locale);

  if (!phone) {
    res.json({ response: getText("setPhoneNoPhone") });
    return;
  }

  const validNumber = /([+]?\d{1,2}[.-\s]?)?(\d{3}[.-]?){2}\d{4}/g;

  if (phone.length < 12 || !phone.match(validNumber)) {
    res.json({
      response: getText("setPhoneInvalid"),
    });
    return;
  }

  // if (user.phone === phone) {
  //   return res.json({ response: "Dit is jouw telefoonnummer al" });
  // }

  const already = await User.findOne({ where: { phone, phoneVerified: true } });

  const phoneVerificationCode = Math.round(Math.random() * 999999);
  let update = { phone, phoneVerified: false, phoneVerificationCode };

  res.json({ success: true });

  twilioClient.messages
    .create({
      body: getText("setPhoneSMS", phoneVerificationCode),
      to: phone,
      from: process.env.TWILIO_PHONE_FROM,
    })
    .then(async (message) => {
      const [updated] = await User.update(update, {
        where: { loginToken: already ? already.loginToken : token },
      });
      console.log(message);
    })
    .catch((e) => {
      console.log("error", e);

      res.json({ success: false, response: getText("setPhoneInvalid") });
    });
});

server.post("/verifyPhone", async (req, res) => {
  const { phone, code } = req.body;

  if (!code || !phone) {
    res.json({ response: getText("verifyPhoneInputError") });
    return;
  }

  //NB: je kan nu gewoon 1mil keer proberen, dit kan binnen een dag. en dan is je account geverifieerd. dit mot anders

  const verifiedUser = await User.findOne({
    where: {
      phone,
      phoneVerificationCode: code,
      phoneVerified: false,
    },
  });

  if (verifiedUser) {
    const updated = await User.update(
      { phoneVerified: true },
      { where: { id: verifiedUser.id } }
    );

    // console.log("updated", updated);

    return res.json({
      success: true,
      token: verifiedUser.loginToken,
      response: getText("success"),
    });
  } else {
    return res.json({ success: false, response: getText("invalidCode") });
  }
});

server.post("/updateName", async (req, res) => {
  const { loginToken, name } = req.body;

  if (!loginToken) {
    return res.json({ response: getText("noToken") });
  }
  const user = await User.findOne({ where: { loginToken } });

  if (!user) {
    res.json({ response: getText("invalidUser") });
    return;
  }

  if (!name) {
    res.json({ response: getText("updateNameNameTooShort") });
    return;
  }
  var realname = name.replace(/[^a-z0-9]/gi, "");

  if (realname.length < 2) {
    res.json({ response: getText("updateNameNameTooShort") });
    return;
  }

  if (realname.length > 20) {
    res.json({ response: getText("updateNameNameTooLong") });
    return;
  }

  const already = await User.findOne({
    where: {
      $and: Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("name")),
        Sequelize.fn("lower", realname)
      ),
    },
  });

  if (already) {
    res.json({ response: getText("updateNameNameInUse") });
    return;
  }

  if (loginToken) {
    const updatedUser = await User.update(
      { name: realname },
      { where: { loginToken } }
    );

    const properties = [
      "bulletFactory",
      "casino",
      "rld",
      "landlord",
      "junkies",
      "weaponShop",
      "airport",
      "estateAgent",
      "garage",
      "jail",
      "bank",
    ];

    //properties
    properties
      .map((p) => `${p}Owner`)
      .map(async (x) => {
        const [updated] = await City.update(
          { [x]: realname },
          { where: { [x]: user.name } }
        );
        return updated;
      });

    res.json({ response: getText("updateNameSuccess") });
  }
});

server.post("/changePassword", async (req, res) => {
  const { token, password } = req.body;

  if (token) {
    const user = await User.update(
      { password },
      { where: { loginToken: token } }
    );
    if (user[0] === 1) {
      res.json({ success: getText("passwordChanged") });
    } else {
      res.json({ error: getText("invalidToken") });
    }
  } else {
    res.json({ error: getText("invalidToken") });
  }
});

server.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({
    where: {
      email,
      password,
    },
  });

  if (user) {
    getText = getTextFunction(user.locale);

    res.json({
      loginToken: user.loginToken,
      success: getText("loginSuccess", user.name),
    });
  } else {
    res.json({ error: getText("loginFail") });
  }
});

const zcaptcha = require("./captcha");

const getCaptcha = async (req, res) => {
  const { loginToken } = req.query;
  if (!loginToken) {
    return res.json({ response: getText("noToken") });
  }
  const code = Math.random().toString().substr(2, 4);
  const image = await zcaptcha.getCaptcha(code, undefined, "transparent");
  res.writeHead(200, {
    "Content-Type": "image/png",
  });

  User.update({ captcha: code }, { where: { loginToken } });

  return res.end(image, "binary");
};

server.get("/captcha.png", getCaptcha);

/*
* * * * * *
| | | | | |
| | | | | day of week
| | | | month
| | | day of month
| | hour
| minute
second ( optional )
*/

//elk uur

const putBulletsInBulletFactories = async () => {
  const online = await User.findAll({
    where: {
      phoneVerified: true,
      onlineAt: { [Op.gt]: Date.now() - 300000 },
    },
  });

  const newBullets = online.length * 1000;
  console.log("online", online.length, " new bullets ", newBullets);

  sequelize.query(`UPDATE cities SET bullets=bullets+${newBullets}`);
};

const giveInterest = () => {
  console.log("rente", new Date());
  sequelize.query(`UPDATE users SET bank=ROUND(bank*1.05) WHERE health > 0`);
};

const deadPeopleTax = () => {
  sequelize.query(
    `UPDATE users SET gamepoints = ROUND(gamepoints * 0.95) WHERE health = 0`
  );
};

const swissBankTax = async () => {
  const TAX = 0.02; //NB profit is 50% of this
  await Promise.all(
    cities.map(async (city) => {
      const [[totals]] = await sequelize.query(
        `SELECT SUM(swissBank) AS swissBank, SUM(swissBullets) AS swissBullets FROM users WHERE city= '${city}'`
      );

      const bankProfit = Math.round(totals.swissBank * TAX * 0.5);

      City.update(
        {
          bankProfit: Sequelize.literal(`bankProfit + ${bankProfit}`),
        },
        { where: { city } }
      );
    })
  );

  sequelize.query(
    `UPDATE users SET swissBank=ROUND(swissBank*0.98), swissBullets=ROUND(swissBullets*0.98)`
  );
};

if (process.env.NODE_APP_INSTANCE == 0) {
  console.log("Scheduling CRONS....");
  //elk uur
  cron.schedule("0 * * * *", async () => {
    putBulletsInBulletFactories();
  });

  cron.schedule("0 20 * * *", function () {
    giveInterest();
    deadPeopleTax();
    swissBankTax();
  });
  cron.schedule("0 19 * * *", function () {
    //send push notification that happy hour is started
  });

  //8 uur savonds
}

const port = process.env.PORT || 4001;

server.listen(port, () => {
  console.log(`Server listening at ${port}`);
  console.log(`instance=${process.env.NODE_APP_INSTANCE}`);
});
