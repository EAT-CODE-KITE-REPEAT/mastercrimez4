const { getRank, needCaptcha, NUM_ACTIONS_UNTIL_VERIFY } = require("./util");
const fetch = require("isomorphic-fetch");
const { Sequelize, Op } = require("sequelize");

const wiet = async (req, res, User, Action) => {
  const { token, captcha } = req.body;

  const timeNeeded = 120000;
  const timeKey = "wietAt";
  const valueKey = "wiet";
  const name = "wietplanten";
  if (!token) {
    res.json({ response: "Geen token" });
    return;
  }

  const isNotVerified = await User.findOne({
    where: { loginToken: token, phoneVerified: false },
  });
  if (isNotVerified && isNotVerified.numActions > NUM_ACTIONS_UNTIL_VERIFY) {
    return res.json({ response: "Je moet je account eerst verifiëren!" });
  }

  const user = await User.findOne({ where: { loginToken: token } });

  if (user) {
    if (user.jailAt > Date.now()) {
      return res.json({ response: "Je zit in de bajes." });
    }

    if (user.health === 0) {
      return res.json({ response: "Je bent dood." });
    }

    if (user.reizenAt > Date.now()) {
      return res.json({ response: "Je bent aan het reizen." });
    }

    if (user.needCaptcha && Number(captcha) !== user.captcha) {
      return res.json({ response: "Verkeerde code!" });
    }

    const rang = getRank(user.rank, "number");

    if (user[timeKey] + timeNeeded < Date.now()) {
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

      const random = Math.ceil(
        Math.random() * 10 * rang * (accomplices.length + 1)
      );

      Action.create({
        userId: user.id,
        action: "wiet",
        timestamp: Date.now(),
      });

      User.update(
        {
          captcha: null,
          needCaptcha: needCaptcha(),
          numActions: Sequelize.literal(`numActions+1`),
          [timeKey]: Date.now(),
          onlineAt: Date.now(),
          [valueKey]: user[valueKey] + random,
          gamepoints: user.gamepoints + 1,
        },
        {
          where: {
            loginToken: token,
            [timeKey]: { [Op.lt]: Date.now() - 120000 },
          },
        }
      );

      res.json({
        response: `Je hebt ${random} ${name} geteelt`,
      });
    } else {
      res.json({
        response: `Je moet nog ${Math.round(
          (user[timeKey] + timeNeeded - Date.now()) / 1000
        )} seconden wachten voor je weer kunt.`,
      });
    }
    //create activity with all variables
  }
};

module.exports = { wiet };
