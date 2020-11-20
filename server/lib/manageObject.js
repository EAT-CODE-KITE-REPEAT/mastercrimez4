const { Op, Sequelize } = require("sequelize");
const { getTextFunction, sendChatPushMail } = require("./util");

let getText = getTextFunction();
let typeStrings = {
  bulletFactory: "Kogelfabriek",
  casino: "Casino",
  landlord: "Huisjesmelker",
  junkies: "Leger des Heils",
  weaponShop: "Wapenwinkel",
  rld: "Red light district",
  airport: "Vliegveld",
  estateAgent: "Makelaarskantoor",
  bank: "Zwitserse Bank",
  jail: "Gevangenis",
  garage: "Garage",
};

const properties = [
  {
    name: "bulletFactory",
    changePrice: true,
    maxPrice: 100,
  },
  {
    name: "casino",
  },
  {
    name: "rld",
  },
  {
    name: "landlord",
  },
  {
    name: "junkies",
  },
  {
    name: "weaponShop",
  },
  {
    name: "airport",
  },
  {
    name: "estateAgent",
  },
  {
    name: "garage",
  },
  {
    name: "jail",
  },
  {
    name: "bank",
  },
];

const becomeOwner = async (req, res, User, City) => {
  const { city, type, token } = req.body;

  if (!token) {
    return res.json({ response: getText("noToken") });
  }

  const user = await User.findOne({ where: { loginToken: token } });
  if (!user) {
    return res.json({ response: getText("invalidUser") });
  }

  getText = getTextFunction(user.locale);

  if (user.jailAt > Date.now()) {
    return res.json({ response: getText("youreInJail") });
  }

  if (user.health === 0) {
    return res.json({ response: getText("youreDead") });
  }

  if (user.reizenAt > Date.now()) {
    return res.json({ response: getText("youreTraveling") });
  }

  const cityObj = await City.findOne({ where: { city } });

  if (!cityObj) {
    return res.json({ response: getText("cityNotFound") });
  }

  const key = properties.map((p) => p.name).includes(type)
    ? `${type}Owner`
    : null;

  if (!key) {
    return res.json({ response: getText("invalidType") });
  }

  const [cityUpdated] = await City.update(
    { [key]: user.name },
    { where: { city: cityObj.city, [key]: null } }
  );

  if (!cityUpdated) {
    return res.json({ response: getText("objectAlreadyOwner") });
  }

  res.json({ response: getText("objectYoureOwner") });
};

const giveAway = async (
  req,
  res,
  { User, City, Channel, ChannelMessage, ChannelSub }
) => {
  const { city, type, token, to } = req.body;

  if (!token) {
    return res.json({ response: getText("noToken") });
  }

  const user = await User.findOne({ where: { loginToken: token } });
  if (!user) {
    return res.json({ response: getText("invalidUser") });
  }

  getText = getTextFunction(user.locale);

  const user2 = await User.findOne({
    where: {
      $and: Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("name")),
        Sequelize.fn("lower", to)
      ),
      health: { [Op.gt]: 0 },
    },
  });

  if (!user2) {
    return res.json({ response: getText("playerDoesntExistOrDead") });
  }

  const key = properties.map((p) => p.name).includes(type)
    ? `${type}Owner`
    : null;

  if (!key) {
    return res.json({ response: getText("invalidType") });
  }

  const cityObj = await City.findOne({ where: { city, [key]: user.name } });

  if (!cityObj) {
    return res.json({ response: getText("objectNotFound") });
  }

  const [cityUpdated] = await City.update(
    { [key]: user2.name },
    { where: { city: cityObj.city, [key]: user.name } }
  );

  if (!cityUpdated) {
    return res.json({ response: getText("objectCantGiveAway") });
  }

  typeStrings = {
    bulletFactory: getText("bulletFactory"),
    casino: getText("casino"),
    landlord: getText("landlord"),
    junkies: getText("junkies"),
    weaponShop: getText("weaponShop"),
    rld: getText("rld"),
    airport: getText("airport"),
    estateAgent: getText("estateAgent"),
    bank: getText("bank"),
    jail: getText("jail"),
    garage: getText("garage"),
  };

  const typeString = typeStrings[type];

  const getUserText = getTextFunction(user2.locale);

  sendChatPushMail({
    Channel,
    ChannelMessage,
    ChannelSub,
    User,
    isSystem: true,
    message: getUserText("objectGiveAwayMessage", user.name, typeString, city),
    user1: user,
    user2,
  });

  res.json({ response: getText("objectGiveAwaySuccess", user2.name) });
};

const changePrice = async (req, res, User, City) => {
  let { city, type, token, price } = req.body;

  price = Math.round(Number(price));

  if (isNaN(price) || price <= 0) {
    return res.json({ response: getText("invalidAmount") });
  }

  if (!token) {
    return res.json({ response: getText("noToken") });
  }

  const user = await User.findOne({ where: { loginToken: token } });
  if (!user) {
    return res.json({ response: getText("invalidUser") });
  }

  getText = getTextFunction(user.locale);

  const key = properties
    .filter((p) => p.changePrice)
    .map((p) => p.name)
    .includes(type)
    ? `${type}Price`
    : null;
  const ding = properties.find((x) => x.name === type);
  const maxPrice = ding ? ding.maxPrice : 0;

  if (!key) {
    return res.json({ response: getText("invalidType") });
  }

  const ownerKey = properties
    .filter((p) => p.changePrice)
    .map((p) => p.name)
    .includes(type)
    ? `${type}Owner`
    : null;

  const cityObj = await City.findOne({
    where: { city, [ownerKey]: user.name },
  });

  if (!cityObj) {
    return res.json({ response: getText("objectNotFound") });
  }

  if (price > maxPrice) {
    return res.json({ response: getText("objectMaxPriceIs", maxPrice) });
  }

  const [cityUpdated] = await City.update(
    { [key]: price },
    { where: { city: cityObj.city } }
  );

  if (!cityUpdated) {
    return res.json({ response: getText("somethingWentWrong") });
  }

  res.json({ response: getText("objectChangePriceSuccess", price) });
};

const getProfit = async (req, res, sequelize, User, City, Action) => {
  let { city, type, token } = req.body;

  if (!token) {
    return res.json({ response: getText("noToken") });
  }

  const user = await User.findOne({ where: { loginToken: token } });
  if (!user) {
    return res.json({ response: getText("invalidUser") });
  }

  getText = getTextFunction(user.locale);

  const key = properties.map((p) => p.name).includes(type)
    ? `${type}Profit`
    : null;

  if (!key) {
    return res.json({ response: getText("invalidType") });
  }
  const ownerKey = properties.map((p) => p.name).includes(type)
    ? `${type}Owner`
    : null;

  const cityObj = await City.findOne({
    where: { city, [ownerKey]: user.name },
  });

  if (!cityObj) {
    return res.json({ response: getText("objectNotFound") });
  }

  const [cityUpdated] = await City.update(
    { [key]: 0 },
    { where: { city: cityObj.city, [key]: { [Op.gt]: 0 } } }
  );

  if (!cityUpdated) {
    return res.json({ response: getText("objectNoProfit") });
  }

  sequelize.query(
    `UPDATE users SET cash = cash+${cityObj[key]} WHERE id = ${user.id}`
  );

  Action.create({
    userId: user.id,
    action: "getprofit",
    timestamp: Date.now(),
  });

  res.json({ response: getText("objectGetProfitSuccess", cityObj[key]) });
};

const repairObject = async (req, res, sequelize, User, City, Action) => {
  let { city, type, token } = req.body;

  if (!token) {
    return res.json({ response: getText("noToken") });
  }

  const user = await User.findOne({ where: { loginToken: token } });
  if (!user) {
    return res.json({ response: getText("invalidUser") });
  }

  getText = getTextFunction(user.locale);

  typeStrings = {
    bulletFactory: getText("bulletFactory"),
    casino: getText("casino"),
    landlord: getText("landlord"),
    junkies: getText("junkies"),
    weaponShop: getText("weaponShop"),
    rld: getText("rld"),
    airport: getText("airport"),
    estateAgent: getText("estateAgent"),
    bank: getText("bank"),
    jail: getText("jail"),
    garage: getText("garage"),
  };

  const key = properties.map((p) => p.name).includes(type)
    ? `${type}Damage`
    : null;

  if (!key) {
    return res.json({ response: getText("invalidType") });
  }
  const ownerKey = properties.map((p) => p.name).includes(type)
    ? `${type}Owner`
    : null;

  const cityObj = await City.findOne({
    where: { city, [ownerKey]: user.name },
  });

  if (!cityObj) {
    return res.json({ response: getText("objectNotFound") });
  }

  const [cityUpdated] = await City.update(
    { [key]: 0 },
    { where: { city: cityObj.city, [key]: { [Op.gt]: 0 } } }
  );

  if (!cityUpdated) {
    return res.json({ response: getText("objectNoDamage") });
  }

  Action.create({
    userId: user.id,
    action: "repairObject",
    timestamp: Date.now(),
  });

  res.json({ response: getText("objectRepairSuccess", typeStrings[type]) });
};

const putInJail = async (
  req,
  res,
  { User, City, Channel, ChannelMessage, ChannelSub, Action }
) => {
  let { city, type, token, who } = req.body;

  if (!token) {
    return res.json({ response: getText("noToken") });
  }

  const user = await User.findOne({ where: { loginToken: token } });
  if (!user) {
    return res.json({ response: getText("invalidUser") });
  }

  getText = getTextFunction(user.locale);

  const user2 = await User.findOne({
    where: {
      $and: Sequelize.where(
        Sequelize.fn("lower", Sequelize.col("name")),
        Sequelize.fn("lower", who)
      ),
      health: { [Op.gt]: 0 },
    },
  });

  if (!user2) {
    return res.json({ response: getText("playerDoesntExistOrDead") });
  }

  const key = ["jail"].includes(type) ? `${type}Profit` : null;

  if (!key) {
    return res.json({ response: getText("invalidtype") });
  }
  const ownerKey = ["jail"].includes(type) ? `${type}Owner` : null;

  const cityObj = await City.findOne({
    where: { city, [ownerKey]: user.name },
  });

  if (!cityObj) {
    return res.json({ response: getText("objectNotFound") });
  }

  if (cityObj.jailPutAt >= Date.now()) {
    const seconds = Math.round((cityObj.jailPutAt - Date.now()) / 1000);
    return res.json({
      response: getText("objectJailWait", seconds),
    });
  }

  Action.create({
    userId: user.id,
    action: "putInJail",
    timestamp: Date.now(),
  });

  City.update(
    { jailPutAt: Date.now() + 600 * 1000 },
    { where: { city: cityObj.city } }
  );

  User.update({ jailAt: Date.now() + 300 * 1000 }, { where: { id: user2.id } });

  const getUserText = getTextFunction(user2.locale);

  sendChatPushMail({
    Channel,
    ChannelMessage,
    ChannelSub,
    User,
    isSystem: true,
    message: getUserText("objectJailMessage", user.name),
    user1: user,
    user2,
  });

  res.json({
    response: getText("objectJailSuccess", user2.name),
  });
};

module.exports = {
  becomeOwner,
  giveAway,
  changePrice,
  getProfit,
  putInJail,
  repairObject,
};
