const { Sequelize, Op } = require("sequelize");
const {
  needCaptcha,
  NUM_ACTIONS_UNTIL_VERIFY,
  getTextFunction,
} = require("./util");

let getText = getTextFunction();

const work = async (req, res, User, Action) => {
  const { token, option, captcha } = req.body;

  if (!token) {
    res.json({ response: getText("noToken") });
    return;
  }

  if (!option || option <= 0 || option > 15) {
    res.json({ response: getText("invalidInput") });
    return;
  }

  const isNotVerified = await User.findOne({
    where: { loginToken: token, phoneVerified: false },
  });
  if (isNotVerified && isNotVerified.numActions > NUM_ACTIONS_UNTIL_VERIFY) {
    return res.json({ response: getText("accountNotVerified") });
  }

  const user = await User.findOne({ where: { loginToken: token } });

  if (!user) {
    res.json({ response: getText("invalidUser") });
    return;
  }

  getText = getTextFunction(user.locale);

  if (user.needCaptcha && Number(captcha) !== user.captcha) {
    return res.json({ response: getText("wrongCode") });
  }

  if (user.jailAt > Date.now()) {
    return res.json({ response: getText("youreInJail") });
  }

  if (user.health === 0) {
    return res.json({ response: getText("youreDead") });
  }

  if (user.reizenAt > Date.now()) {
    return res.json({ response: getText("youreTraveling") });
  }

  if (user.workAt > Date.now()) {
    const minute = Math.round((user.workAt - Date.now()) / (60 * 1000));
    return res.json({
      response: getText("workWait", minute),
    });
  }
};

const kans = Math.round((user.rank + 30) / (option * option));
const kans2 = kans > 75 ? 75 : kans;

const random = Math.ceil(Math.random() * 100);

const [updated] = await User.update(
  {
    crimeAt: Date.now(),
    onlineAt: Date.now(),
    captcha: null,
    needCaptcha: needCaptcha(),
    numActions: Sequelize.literal(`numActions+1`),
  },
  {
    where: {
      loginToken: token,
      crimeAt: { [Op.lt]: Date.now() - 60000 },
    },
  }
);

if (!updated) {
  return res.json({ response: getText("couldntUpdateUser") });
}

Action.create({
  userId: user.id,
  action: "crime",
  timestamp: Date.now(),
});

if (kans2 >= random) {
  const accomplices = await User.findAll({
    attributes: ["name"],
    where: Sequelize.and(
      { ocAt: { [Op.gt]: Date.now() - 120000 } },
      Sequelize.or(
        { accomplice: user.name },
        { accomplice2: user.name },
        { accomplice3: user.name },
        { accomplice4: user.name }
      )
    ),
  });

  const stolen = Math.ceil(
    Math.random() * option * 10000 * (accomplices.length + 1)
  );
  User.update(
    {
      rank: user.rank + option * 3,
      cash: user.cash + stolen,
      gamepoints: user.gamepoints + 1,
    },
    { where: { loginToken: token } }
  );

  res.json({
    response: getText("workSuccess", stolen),
  });
} else {
  const random2 = Math.ceil(Math.random() * 100);

  if (random2 > 50) {
    const seconden = 90;
    User.update(
      { jailAt: Date.now() + seconden * 1000 },
      { where: { id: user.id } }
    );
    res.json({
      response: getText("workFail", seconden),
    });
  } else {
    res.json({ response: getText("fail") });
  }

  //create activity with all variables
}

module.exports = { work };
